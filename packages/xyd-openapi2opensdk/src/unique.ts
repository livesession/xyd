/** Allocate a unique name within `used`, suffixing `2`, `3`, … on collision. */
export function uniqueName(base: string, used: Set<string>): string {
  let name = base;
  let i = 2;
  while (used.has(name)) {
    name = `${base}${i}`;
    i++;
  }
  used.add(name);
  return name;
}
