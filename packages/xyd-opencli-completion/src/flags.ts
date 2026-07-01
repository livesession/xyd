/** Split flag spellings into short (`-x`), long (`--xy`) and old-style (`-xy`). */
export function splitFlags(flags: string[]): { short: string[]; long: string[]; old: string[] } {
  const short: string[] = [];
  const long: string[] = [];
  const old: string[] = [];
  for (const f of flags) {
    if (f.startsWith('--')) long.push(f.slice(2));
    else if (f.startsWith('-') && f.length === 2) short.push(f.slice(1));
    else if (f.startsWith('-')) old.push(f.slice(1));
  }
  return { short, long, old };
}
