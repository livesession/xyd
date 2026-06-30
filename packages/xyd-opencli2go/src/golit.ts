// Tiny Go-source string helpers (fern's CLI-generator style): just enough to
// render struct/slice literals with correct indentation — not a full AST.

const TAB = '\t';
const pad = (n: number) => TAB.repeat(n);

/** A value renderer: its first line is emitted inline; nested lines indent to `indent`. */
export type GoVal = (indent: number) => string;

/** A pre-rendered scalar (identifier, number, bool, expression). */
export const lit = (s: string): GoVal => () => s;

/** A Go double-quoted string literal (JSON escaping is valid Go for our content). */
export const goStr = (s: string): GoVal => () => JSON.stringify(s);

export const goBool = (b: boolean): GoVal => () => String(b);
export const goInt = (n: number): GoVal => () => String(n);

/** A struct literal: `Type{ Field: value, ... }` (prefix `&` when pointer). */
export function goStruct(type: string, fields: [string, GoVal][], pointer = false): GoVal {
  return (indent: number) => {
    const head = `${pointer ? '&' : ''}${type}{`;
    if (fields.length === 0) return `${head}}`;
    let out = `${head}\n`;
    for (const [k, v] of fields) {
      out += `${pad(indent + 1)}${k}: ${v(indent + 1)},\n`;
    }
    out += `${pad(indent)}}`;
    return out;
  };
}

/** A slice literal: `[]Elem{ a, b, ... }`. */
export function goSlice(elemType: string, elems: GoVal[]): GoVal {
  return (indent: number) => {
    if (elems.length === 0) return `[]${elemType}{}`;
    let out = `[]${elemType}{\n`;
    for (const e of elems) {
      out += `${pad(indent + 1)}${e(indent + 1)},\n`;
    }
    out += `${pad(indent)}}`;
    return out;
  };
}

/** Render a top-level declaration value (indent 0). */
export function render(v: GoVal): string {
  return v(0);
}

/** Tracks the import paths a file needs. Qualifiers are implied by the emitted code. */
export class Imports {
  private paths = new Set<string>();

  add(...importPaths: string[]): this {
    for (const p of importPaths) this.paths.add(p);
    return this;
  }

  get size(): number {
    return this.paths.size;
  }

  render(): string {
    if (this.paths.size === 0) return '';
    const all = [...this.paths];
    const std = all.filter((p) => !p.split('/')[0].includes('.')).sort();
    const ext = all.filter((p) => p.split('/')[0].includes('.')).sort();
    const groups = [std, ext].filter((g) => g.length > 0);
    const block = groups.map((g) => g.map((p) => `${TAB}${JSON.stringify(p)}`).join('\n')).join('\n\n');
    return `import (\n${block}\n)`;
  }
}

/** Assemble a complete Go file: package clause + imports + declarations. */
export function goFile(pkg: string, imports: Imports, decls: string[]): string {
  const parts = [`package ${pkg}`];
  if (imports.size > 0) parts.push(imports.render());
  parts.push(...decls);
  return `${parts.join('\n\n')}\n`;
}
