// clap Arg emission for flags + positionals (the flags.ts mirror from opencli2go).
// Bool flags accept both `--x` and `--x=false` (num_args 0..=1 + require_equals),
// matching urfave/cli's bool semantics; slices accept repetition and commas.

import type { FlagModel } from './model';
import { chain, lit, rsStr, type RsVal } from './rslit';

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

  if (f.description) calls.push(['help', [rsStr(f.description)]]);
  if (f.required) calls.push(['required', [lit('true')]]);
  if (f.hidden) calls.push(['hide', [lit('true')]]);

  return chain(`Arg::new(${JSON.stringify(f.flagName)})`, calls);
}

export function renderFlagArgs(flags: FlagModel[]): RsVal[] {
  return flags.map(renderFlagArg);
}

/** A positional argument (clap requires declaring positionals; Go read them untyped). */
export function renderPositionalArg(arg: { name: string; required?: boolean; description?: string }): RsVal {
  const calls: [string, RsVal[]][] = [];
  if (arg.description) calls.push(['help', [rsStr(arg.description)]]);
  if (arg.required === true) calls.push(['required', [lit('true')]]);
  return chain(`Arg::new(${JSON.stringify(arg.name)})`, calls);
}
