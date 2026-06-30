import { goBool, goSlice, goStr, goStruct, type GoVal } from './golit';
import type { FlagModel, GoType } from './model';

const FLAG_TYPE: Record<GoType, string> = {
  bool: 'BoolFlag',
  int: 'IntFlag',
  float: 'FloatFlag',
  slice: 'StringSliceFlag',
  string: 'StringFlag',
  json: 'StringFlag',
  file: 'StringFlag',
};

export function renderFlag(f: FlagModel): GoVal {
  const type = `cli.${FLAG_TYPE[f.goType]}`;
  const fields: [string, GoVal][] = [['Name', goStr(f.flagName)]];
  if (f.aliases.length) fields.push(['Aliases', goSlice('string', f.aliases.map(goStr))]);
  if (f.description) fields.push(['Usage', goStr(f.description)]);
  if (f.required) fields.push(['Required', goBool(true)]);
  if (f.hidden) fields.push(['Hidden', goBool(true)]);
  return goStruct(type, fields, true);
}

export function renderFlags(flags: FlagModel[]): GoVal[] {
  return flags.map(renderFlag);
}
