// clap Arg emission for flags + positionals (the flags.ts mirror from opencli2go).
// Bool flags accept both `--x` and `--x=false` (num_args 0..=1 + require_equals),
// matching urfave/cli's bool semantics; slices accept repetition and commas.

import type { FlagModel } from './model';
import { chain, lit, rsStr, type RsVal } from './rslit';

/** A clap `.num_args(...)` range from an OpenCLI arity, or null when unconstrained. */
function arityRange(arity: { minimum?: number; maximum?: number }): string | null {
  const hasMin = typeof arity.minimum === 'number';
  const hasMax = typeof arity.maximum === 'number';
  if (hasMin && hasMax) return `${arity.minimum}..=${arity.maximum}`;
  if (hasMin) return `${arity.minimum}..`;
  if (hasMax) return `..=${arity.maximum}`;
  return null;
}

/** A clap `.value_parser([...])` argument literal from a list of accepted values. */
function valueParserList(values: string[]): RsVal {
  return lit(`[${values.map((v) => JSON.stringify(v)).join(', ')}]`);
}

export function renderFlagArg(f: FlagModel): RsVal {
  const calls: [string, RsVal[]][] = [['long', [rsStr(f.flagName)]]];

  const shorts = f.aliases.filter((a) => a.length === 1);
  const longs = f.aliases.filter((a) => a.length > 1);
  if (shorts.length) calls.push(['short', [lit(`'${shorts[0]}'`)]]);
  if (longs.length === 1) calls.push(['visible_alias', [rsStr(longs[0])]]);
  else if (longs.length > 1) calls.push(['visible_aliases', [lit(`[${longs.map((l) => JSON.stringify(l)).join(', ')}]`)]]);

  switch (f.flagType) {
    case 'int':
      calls.push(['value_parser', [lit('clap::value_parser!(i64)')]]);
      break;
    case 'float':
      calls.push(['value_parser', [lit('clap::value_parser!(f64)')]]);
      break;
    case 'bool':
      calls.push(['num_args', [lit('0..=1')]]);
      calls.push(['require_equals', [lit('true')]]);
      calls.push(['default_missing_value', [rsStr('true')]]);
      calls.push(['value_parser', [lit('clap::value_parser!(bool)')]]);
      break;
    case 'slice':
      calls.push(['action', [lit('clap::ArgAction::Append')]]);
      calls.push(['value_delimiter', [lit("','")]]);
      break;
    default:
      break; // string | json | file: clap's default String parsing
  }

  // Non-API leaf extras — additive and field-gated. `buildLeafModel` never sets
  // these, so x-openapi flags render exactly as before.
  if (f.acceptedValues?.length) calls.push(['value_parser', [valueParserList(f.acceptedValues)]]);
  if (f.arity) {
    const range = arityRange(f.arity);
    if (range) calls.push(['num_args', [lit(range)]]);
  }

  if (f.description) calls.push(['help', [rsStr(f.description)]]);
  if (f.required) calls.push(['required', [lit('true')]]);
  if (f.hidden) calls.push(['hide', [lit('true')]]);

  return chain(`Arg::new(${JSON.stringify(f.flagName)})`, calls);
}

export function renderFlagArgs(flags: FlagModel[]): RsVal[] {
  return flags.map(renderFlagArg);
}

/**
 * A positional argument (clap requires declaring positionals; Go read them untyped).
 * `local` gates the non-API extras (`acceptedValues → .value_parser`, `arity →
 * .num_args`): the x-openapi call site passes `false`, so API positionals stay
 * byte-identical even when their OpenCLI argument carries those fields.
 */
export function renderPositionalArg(
  arg: { name: string; required?: boolean; description?: string; acceptedValues?: string[]; arity?: { minimum?: number; maximum?: number } },
  local: boolean,
): RsVal {
  const calls: [string, RsVal[]][] = [];
  if (arg.description) calls.push(['help', [rsStr(arg.description)]]);
  if (local && arg.acceptedValues?.length) calls.push(['value_parser', [valueParserList(arg.acceptedValues)]]);
  if (local && arg.arity) {
    const range = arityRange(arg.arity);
    if (range) calls.push(['num_args', [lit(range)]]);
  }
  if (arg.required === true) calls.push(['required', [lit('true')]]);
  return chain(`Arg::new(${JSON.stringify(arg.name)})`, calls);
}
