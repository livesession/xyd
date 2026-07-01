import { generateUsage } from './generate';
import type { Argument, Command, OpencliSpecJson, Option } from './types';

// Structural subset of @xyd-js/uniform's `Reference` — kept local so the OpenCLI
// core stays free of the (React-typed) uniform package. The docs engine consumes
// these as uniform References (api.cli → Atlas).
interface OpencliRefProperty {
  name: string;
  type: string;
  description: string;
  meta?: { name: string; value: unknown }[];
}
interface OpencliRefDefinition {
  title: string;
  properties: OpencliRefProperty[];
}
interface OpencliRefCodeTab {
  title: string;
  code: string;
  language: string;
}
interface OpencliRefExampleGroup {
  description?: string;
  examples: { description?: string; codeblock: { title?: string; tabs: OpencliRefCodeTab[] } }[];
}
export interface OpencliReference {
  title: string;
  canonical: string;
  description: string;
  // Marks these as CLI references so the docs engine / Atlas can render the
  // usage-formula header (mirrors an OpenAPI page's method + path).
  category: 'cli';
  // `group` drives sidebar placement (the docs engine groups references by it);
  // `path` is the region key round-tripped through the page frontmatter.
  context: { path: string; fullPath: string; group: string[] };
  // a runnable CLI invocation, rendered by Atlas as a code sample (like the
  // request/response samples on an OpenAPI page).
  examples: { groups: OpencliRefExampleGroup[] };
  definitions: OpencliRefDefinition[];
}

export interface OpencliToReferencesOptions {
  /**
   * Restrict output to specific commands. Each region is a command path,
   * space-joined from the CLI root (e.g. `"install"`, `"remote add"`).
   */
  regions?: string[];

  /**
   * Render the CLI's global (root recursive) options on every command page.
   * When false (the default), a single "Global options" reference is emitted
   * instead — so the options appear once in the sidebar rather than repeated
   * on every command.
   */
  globalOptionsPerCommand?: boolean;
}

const GLOBAL_OPTIONS_REGION = 'global-options';

/**
 * Convert an OpenCLI document to uniform `Reference[]` — one Reference per
 * command — so the docs engine can render CLI reference pages the same way it
 * renders OpenAPI/GraphQL (`api.cli`). Mirrors `oapSchemaToReferences`.
 */
export function opencliToReferences(
  spec: OpencliSpecJson | null | undefined,
  options: OpencliToReferencesOptions = {},
): OpencliReference[] {
  if (!spec) return [];

  const cliTitle = spec.info?.title || 'cli';
  const regionSet = options.regions?.length ? new Set(options.regions) : null;
  const perCommand = options.globalOptionsPerCommand ?? false;
  const refs: OpencliReference[] = [];

  // Root-level recursive options (e.g. a CLI's global flags) apply to every
  // command. By default they get their own page; with `globalOptionsPerCommand`
  // they're rendered as a "Global options" section on each command instead.
  const globalOptions = (spec.options || []).filter((o) => o.recursive && !o.hidden);

  const walk = (commands: Command[] | undefined, parentPath: string[]) => {
    for (const cmd of commands || []) {
      if (cmd.hidden) continue;
      const cmdPath = [...parentPath, cmd.name];
      const region = cmdPath.join(' ');
      if (!regionSet || regionSet.has(region)) {
        refs.push(commandToReference(spec, cmd, cmdPath, cliTitle, perCommand ? globalOptions : []));
      }
      if (cmd.commands?.length) walk(cmd.commands, cmdPath);
    }
  };
  walk(spec.commands, []);

  // Default: the global options live on a single dedicated page in the sidebar.
  if (!perCommand && globalOptions.length && (!regionSet || regionSet.has(GLOBAL_OPTIONS_REGION))) {
    refs.push(globalOptionsReference(globalOptions));
  }

  return refs;
}

function globalOptionsReference(globalOptions: Option[]): OpencliReference {
  return {
    title: 'Global options',
    canonical: GLOBAL_OPTIONS_REGION,
    description: 'Options available on every command.',
    category: 'cli',
    context: { path: GLOBAL_OPTIONS_REGION, fullPath: '', group: ['Global options'] },
    examples: { groups: [] },
    definitions: [{ title: 'Global options', properties: globalOptions.map(optionToProperty) }],
  };
}

function commandToReference(
  spec: OpencliSpecJson,
  cmd: Command,
  cmdPath: string[],
  cliTitle: string,
  globalOptions: Option[] = [],
): OpencliReference {
  const region = cmdPath.join(' ');
  const displayPath = `${cliTitle} ${region}`.trim();

  const definitions: OpencliRefDefinition[] = [];

  const args = (cmd.arguments || []).filter((a) => !a.hidden);
  if (args.length) {
    definitions.push({ title: 'Arguments', properties: args.map(argumentToProperty) });
  }

  const opts = (cmd.options || []).filter((o) => !o.hidden);
  if (opts.length) {
    definitions.push({ title: 'Options', properties: opts.map(optionToProperty) });
  }

  const subs = (cmd.commands || []).filter((c) => !c.hidden);
  if (subs.length) {
    definitions.push({
      title: 'Commands',
      properties: subs.map((s) => ({
        name: s.name,
        type: 'command',
        description: s.description || '',
      })),
    });
  }

  // Global flags (root-level recursive options) available on every command.
  if (globalOptions.length) {
    definitions.push({ title: 'Global options', properties: globalOptions.map(optionToProperty) });
  }

  // Sidebar grouping: a leaf top-level command sits directly under "Commands".
  // A command that owns subcommands becomes a nested group (named after itself)
  // under "Commands", and each of its subcommands sits inside that same group —
  // e.g. `components` + `components install` → "Commands" › "components".
  const hasSubcommands = (cmd.commands || []).some((c) => !c.hidden);
  const group =
    cmdPath.length === 1 && !hasSubcommands ? ['Commands'] : ['Commands', ...(hasSubcommands ? cmdPath : cmdPath.slice(0, -1))];

  // The runnable invocation ("CLI Tool") at groups[0], plus — when the OpenAPI
  // binding carried one — an "Example response" group rendered as a JSON sample.
  // This mirrors an OpenAPI page's request + response code samples; Atlas stacks
  // the groups vertically. Keep the CLI Tool group first.
  const groups: OpencliRefExampleGroup[] = [{ examples: cliToolExamples(cliTitle, cmd, cmdPath) }];
  const responseGroup = responseExampleGroup(cmd);
  if (responseGroup) groups.push(responseGroup);

  return {
    // A command that owns subcommands reads as "<path> <command>" so it's
    // distinct from its group and shows it takes a subcommand.
    title: (hasSubcommands ? `${region} <command>` : region) || cliTitle,
    canonical: cmdPath.join('/') || cliTitle,
    description: cmd.description || '',
    category: 'cli',
    // context.path is the region key the docs engine writes into the page
    // frontmatter (`cli: <spec>#<path>`) and reads back to re-resolve the command.
    context: { path: region, fullPath: generateUsage(spec, cmd, displayPath), group },
    examples: { groups },
    definitions,
  };
}

/** Map a response content type to a code-sample language. */
function responseLanguage(contentType: string | undefined): string {
  if (!contentType) return 'json';
  if (/json/i.test(contentType)) return 'json';
  if (/xml/i.test(contentType)) return 'xml';
  return 'text';
}

/**
 * The "Example response" group built from the command's `x-openapi.responses`
 * binding (emitted by openapi2opencli) — one code sample per captured response,
 * rendered alongside the "CLI Tool" invocation like an OpenAPI page's
 * request/response samples. Returns null when no response example is available.
 */
function responseExampleGroup(cmd: Command): OpencliRefExampleGroup | null {
  const responses = cmd['x-openapi']?.responses;
  if (!responses?.length) return null;

  const examples: OpencliRefExampleGroup['examples'] = [];
  for (const res of responses) {
    if (res.example == null) continue; // skip missing / null bodies (no useful sample)
    const code = typeof res.example === 'string' ? res.example : JSON.stringify(res.example, null, 2);
    examples.push({
      codeblock: {
        title: res.status || '200',
        tabs: [{ title: res.contentType || 'application/json', language: responseLanguage(res.contentType), code }],
      },
    });
  }
  if (!examples.length) return null;
  return { description: 'Example response', examples };
}

/** Shell-quote a value only when it needs it (spaces / special chars). */
function shellQuote(value: string): string {
  return /[\s'"$`\\<>|&;()]/.test(value) ? `'${value.replace(/'/g, "'\\''")}'` : value;
}

/** A representative value for an argument: an explicit example, an accepted/enum value, else a placeholder. */
function exampleValue(arg: Argument | undefined): string {
  const example = arg?.metadata?.find((m) => m.name === 'example')?.value;
  if (typeof example === 'string' && example) return example;
  if (arg?.acceptedValues?.length) return String(arg.acceptedValues[0]);
  return 'Example data';
}

/**
 * The "CLI Tool" example(s) for a command. When a required argument enumerates
 * its accepted values (e.g. `completion <zsh|fish>`), each value becomes its own
 * example (`codeblock.title` = the value) — so Atlas renders an example-level
 * switcher (`[zsh] [fish]`) rather than language tabs inside a single code
 * block. Otherwise a single "CLI Tool" example.
 */
function cliToolExamples(cliTitle: string, cmd: Command, cmdPath: string[]): OpencliRefExampleGroup['examples'] {
  const reqArgs = (cmd.arguments || []).filter((a) => a.required && !a.hidden);
  // The argument whose representative value(s) label the example(s): an enum
  // (acceptedValues) gives one tab per value; a single example value gives one.
  const variantArg = [...reqArgs].reverse().find((a) => a.acceptedValues?.length || argExampleValue(a) != null);
  const values = variantArg?.acceptedValues?.length
    ? variantArg.acceptedValues.map(String)
    : variantArg
      ? [String(argExampleValue(variantArg))]
      : null;

  if (variantArg && values) {
    // Each value is its own example (`codeblock.title` = the value) so Atlas
    // renders an example switcher — `[zsh] [fish]`, `[diagrams]`, etc.
    return values.map((value) => ({
      codeblock: {
        title: value,
        tabs: [
          {
            title: 'CLI Tool',
            language: 'shell',
            code: generateCliExample(cliTitle, cmd, cmdPath, { [variantArg.name]: value }),
          },
        ],
      },
    }));
  }

  return [{ codeblock: { tabs: [{ title: 'CLI Tool', language: 'shell', code: generateCliExample(cliTitle, cmd, cmdPath) }] } }];
}

/** An argument's explicit example value (from metadata), or null. */
function argExampleValue(arg: Argument): string | null {
  const example = arg.metadata?.find((m) => m.name === 'example')?.value;
  return typeof example === 'string' && example ? example : null;
}

/**
 * A runnable, concrete CLI invocation for a command — the command path plus its
 * required arguments and options filled with example values, one option per line
 * (the shape shown on an OpenAPI page's request sample). `overrides` pins a
 * specific value for a named argument (used to render one tab per accepted value).
 */
function generateCliExample(
  cliTitle: string,
  cmd: Command,
  cmdPath: string[],
  overrides: Record<string, string> = {},
): string {
  let head = [cliTitle, ...cmdPath].join(' ');

  // A command group takes a subcommand — shown as a placeholder (unquoted, like
  // the usage formula), e.g. `xyd components <command>`.
  if ((cmd.commands || []).some((c) => !c.hidden)) {
    head += ' <command>';
  }

  for (const arg of (cmd.arguments || []).filter((a) => a.required && !a.hidden)) {
    head += ` ${shellQuote(overrides[arg.name] ?? exampleValue(arg))}`;
  }

  const lines = [head];
  for (const opt of (cmd.options || []).filter((o) => o.required && !o.hidden)) {
    if (!opt.arguments?.length) {
      lines.push(`--${opt.name}`); // boolean flag
    } else {
      lines.push(`--${opt.name} ${shellQuote(exampleValue(opt.arguments[0]))}`);
    }
  }

  return lines.join(' \\\n  ');
}

function argumentToProperty(arg: Argument): OpencliRefProperty {
  const meta: { name: string; value: unknown }[] = [];
  if (arg.required) meta.push({ name: 'required', value: 'true' });
  // Surface the argument's accepted values / example in the Arguments section
  // (e.g. `component` → diagrams, `shell` → zsh, fish).
  if (arg.acceptedValues?.length) {
    meta.push({ name: 'examples', value: arg.acceptedValues });
  } else {
    const example = arg.metadata?.find((m) => m.name === 'example')?.value;
    if (example != null && example !== '') meta.push({ name: 'example', value: example });
  }
  return {
    name: arg.name,
    type: arg.arity ? 'array' : 'string',
    description: arg.description || '',
    ...(meta.length ? { meta } : {}),
  };
}

function optionToProperty(opt: Option): OpencliRefProperty {
  const aliasNote = opt.aliases?.length
    ? ` (alias: ${opt.aliases.map((a) => (a.length === 1 ? `-${a}` : `--${a}`)).join(', ')})`
    : '';
  const meta = opt.required ? [{ name: 'required', value: 'true' }] : undefined;
  return {
    name: `--${opt.name}`,
    // an option that takes a value vs. a boolean flag
    type: opt.arguments?.length ? 'string' : 'boolean',
    description: `${opt.description || ''}${aliasNote}`,
    ...(meta ? { meta } : {}),
  };
}
