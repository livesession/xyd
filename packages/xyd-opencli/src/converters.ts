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
}

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
  const refs: OpencliReference[] = [];

  // Root-level recursive options (e.g. a CLI's global flags) apply to every
  // command, so they're rendered as a "Global options" section on each page.
  const globalOptions = (spec.options || []).filter((o) => o.recursive && !o.hidden);

  const walk = (commands: Command[] | undefined, parentPath: string[]) => {
    for (const cmd of commands || []) {
      if (cmd.hidden) continue;
      const cmdPath = [...parentPath, cmd.name];
      const region = cmdPath.join(' ');
      if (!regionSet || regionSet.has(region)) {
        refs.push(commandToReference(spec, cmd, cmdPath, cliTitle, globalOptions));
      }
      if (cmd.commands?.length) walk(cmd.commands, cmdPath);
    }
  };
  walk(spec.commands, []);

  return refs;
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

  // Sidebar grouping: top-level commands sit under "Commands"; a subcommand sits
  // under a group named after its parent path (e.g. `auth login` → group "auth").
  // (One group level is required — the docs engine drops references with an empty
  // group — and a group must not mix direct pages with subgroups.)
  const group = cmdPath.length === 1 ? ['Commands'] : [cmdPath.slice(0, -1).join(' ')];

  // The runnable invocation ("CLI Tool") at groups[0], plus — when the OpenAPI
  // binding carried one — an "Example response" group rendered as a JSON sample.
  // This mirrors an OpenAPI page's request + response code samples; Atlas stacks
  // the groups vertically. Keep the CLI Tool group first.
  const groups: OpencliRefExampleGroup[] = [
    {
      examples: [
        {
          codeblock: {
            tabs: [{ title: 'CLI Tool', language: 'shell', code: generateCliExample(cliTitle, cmd, cmdPath) }],
          },
        },
      ],
    },
  ];
  const responseGroup = responseExampleGroup(cmd);
  if (responseGroup) groups.push(responseGroup);

  return {
    title: region || cliTitle,
    canonical: cmdPath.join('/') || cliTitle,
    description: cmd.description || '',
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

/** A representative value for an argument: an accepted/enum value, else a placeholder. */
function exampleValue(arg: Argument | undefined): string {
  if (arg?.acceptedValues?.length) return String(arg.acceptedValues[0]);
  return 'Example data';
}

/**
 * A runnable, concrete CLI invocation for a command — the command path plus its
 * required arguments and options filled with example values, one option per line
 * (the shape shown on an OpenAPI page's request sample).
 */
function generateCliExample(cliTitle: string, cmd: Command, cmdPath: string[]): string {
  let head = [cliTitle, ...cmdPath].join(' ');

  for (const arg of (cmd.arguments || []).filter((a) => a.required && !a.hidden)) {
    head += ` ${shellQuote(exampleValue(arg))}`;
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
  const meta = arg.required ? [{ name: 'required', value: 'true' }] : undefined;
  return {
    name: arg.name,
    type: arg.arity ? 'array' : 'string',
    description: arg.description || '',
    ...(meta ? { meta } : {}),
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
