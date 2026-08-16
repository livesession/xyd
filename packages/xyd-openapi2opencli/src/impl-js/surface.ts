import type { Command, OpencliSpecJson, XOpenApiCommand } from '@xyd-js/opencli';

// A canonical, language-agnostic "CLI surface" both our OpenCLI output and the
// openai-cli Go source reduce to, so they can be diffed command-by-command.

export type FlagKind = 'path' | 'query' | 'body' | 'header' | 'global' | 'unknown';

export interface SurfaceFlag {
  name: string; // kebab CLI flag name
  required: boolean;
  kind: FlagKind;
}

export interface SurfaceCommand {
  path: string[]; // e.g. ["chat","completions","create"]
  flags: SurfaceFlag[];
}

export interface CliSurface {
  commands: SurfaceCommand[];
}

function locationToKind(location: string): FlagKind {
  switch (location) {
    case 'query':
      return 'query';
    case 'body':
      return 'body';
    case 'header':
      return 'header';
    case 'cookie':
      return 'header';
    default:
      return 'unknown';
  }
}

function sortFlags(flags: SurfaceFlag[]): SurfaceFlag[] {
  return [...flags].sort((a, b) => a.name.localeCompare(b.name));
}

const fromOption = (from: string | undefined): string | undefined =>
  from && from.startsWith('option:') ? from.slice('option:'.length) : undefined;

/** Classify an OpenCLI option's flag kind from the command's x-openapi binding. */
function optionKind(optName: string, x: XOpenApiCommand | undefined): FlagKind {
  const param = (x?.params || []).find((p) => fromOption(p.from) === optName && p.in !== 'path');
  if (param) return locationToKind(param.in);
  const inBody =
    (x?.body?.properties || []).some((p) => fromOption(p.from) === optName) ||
    fromOption(x?.body?.from) === optName;
  return inBody ? 'body' : 'query';
}

/** Flatten an OpenCLI document to the canonical surface (path params become `path` flags). */
export function opencliToSurface(spec: OpencliSpecJson): CliSurface {
  const commands: SurfaceCommand[] = [];

  const walk = (cmds: Command[], prefix: string[]) => {
    for (const c of cmds) {
      const path = [...prefix, c.name];
      if (c.commands?.length) {
        walk(c.commands, path);
      } else if (c['x-openapi']) {
        const x = c['x-openapi'] as XOpenApiCommand;
        const flags: SurfaceFlag[] = [];
        for (const a of c.arguments || []) {
          flags.push({ name: a.name, required: a.required === true, kind: 'path' });
        }
        for (const opt of c.options || []) {
          flags.push({ name: opt.name, required: opt.required === true, kind: optionKind(opt.name, x) });
        }
        commands.push({ path, flags: sortFlags(flags) });
      }
    }
  };

  walk(spec.commands || [], []);
  return commands.length ? { commands } : { commands: [] };
}

const key = (path: string[]) => path.join(' ');

export interface CommandDiff {
  path: string[];
  flagsOnlyOurs: string[];
  flagsOnlyOracle: string[];
  pathKindMismatch: string[]; // flags present on both but path-vs-non-path differs
}

export interface SurfaceDiff {
  oracleCommandCount: number;
  oursCommandCount: number;
  commandsMatched: string[]; // present in both
  commandsOnlyOracle: string[];
  commandsOnlyOurs: string[];
  perCommand: CommandDiff[]; // for matched commands with flag differences
  l0Coverage: number; // |matched| / oracleCount
  l1Coverage: number; // matched commands whose flags fully agree / oracleCount
}

export interface Allowlist {
  /** Command paths (space-joined) to skip entirely. */
  skipCommands?: string[];
  /** Flag names that are expected extras on the oracle side for any command (e.g. pagination). */
  oracleOnlyFlags?: string[];
  /** Flag names that are expected extras on our side for any command. */
  oursOnlyFlags?: string[];
}

/** Diff two surfaces command-by-command, applying an allowlist of known divergences. */
export function diffSurfaces(ours: CliSurface, oracle: CliSurface, allow: Allowlist = {}): SurfaceDiff {
  const skip = new Set(allow.skipCommands || []);
  const oracleOnlyOk = new Set(allow.oracleOnlyFlags || []);
  const oursOnlyOk = new Set(allow.oursOnlyFlags || []);

  const oursByKey = new Map(ours.commands.map((c) => [key(c.path), c]));
  const oracleByKey = new Map(oracle.commands.map((c) => [key(c.path), c]));

  const oracleKeys = [...oracleByKey.keys()].filter((k) => !skip.has(k));
  const matched: string[] = [];
  const onlyOracle: string[] = [];
  const onlyOurs: string[] = [];
  const perCommand: CommandDiff[] = [];
  let l1Clean = 0;

  for (const k of oracleKeys) {
    if (oursByKey.has(k)) matched.push(k);
    else onlyOracle.push(k);
  }
  for (const k of oursByKey.keys()) {
    if (!skip.has(k) && !oracleByKey.has(k)) onlyOurs.push(k);
  }

  for (const k of matched) {
    const o = oursByKey.get(k)!;
    const r = oracleByKey.get(k)!;
    const oNames = new Map(o.flags.map((f) => [f.name, f]));
    const rNames = new Map(r.flags.map((f) => [f.name, f]));

    const flagsOnlyOurs = [...oNames.keys()].filter((n) => !rNames.has(n) && !oursOnlyOk.has(n));
    const flagsOnlyOracle = [...rNames.keys()].filter((n) => !oNames.has(n) && !oracleOnlyOk.has(n));
    const pathKindMismatch = [...oNames.keys()]
      .filter((n) => rNames.has(n))
      .filter((n) => (oNames.get(n)!.kind === 'path') !== (rNames.get(n)!.kind === 'path'));

    if (flagsOnlyOurs.length || flagsOnlyOracle.length || pathKindMismatch.length) {
      perCommand.push({ path: o.path, flagsOnlyOurs, flagsOnlyOracle, pathKindMismatch });
    } else {
      l1Clean++;
    }
  }

  const oracleCount = oracleKeys.length || 1;
  return {
    oracleCommandCount: oracleKeys.length,
    oursCommandCount: ours.commands.length,
    commandsMatched: matched.sort(),
    commandsOnlyOracle: onlyOracle.sort(),
    commandsOnlyOurs: onlyOurs.sort(),
    perCommand: perCommand.sort((a, b) => key(a.path).localeCompare(key(b.path))),
    l0Coverage: matched.length / oracleCount,
    l1Coverage: l1Clean / oracleCount,
  };
}
