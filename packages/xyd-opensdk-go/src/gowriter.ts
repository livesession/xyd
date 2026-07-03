// A small string-emitting Go writer (no Go toolchain). Richer than opencli2go's
// golit — it tracks *aliased* imports (needed once a project has internal
// sub-packages like param/apijson/option/requestconfig) and assembles files.

const TAB = '\t';

/** Tracks the import paths a file needs, with optional aliases, grouped std vs ext. */
export class Imports {
  private paths = new Map<string, string | undefined>();

  /** Add an import path (optionally aliased). Returns the qualifier to use in code. */
  add(path: string, alias?: string): string {
    if (!this.paths.has(path)) this.paths.set(path, alias);
    return alias ?? this.paths.get(path) ?? lastSegment(path);
  }

  get size(): number {
    return this.paths.size;
  }

  render(): string {
    if (this.paths.size === 0) return '';
    const entries = [...this.paths.entries()];
    const isExt = (p: string) => p.split('/')[0].includes('.');
    const line = ([p, alias]: [string, string | undefined]) =>
      `${TAB}${alias ? `${alias} ` : ''}${JSON.stringify(p)}`;
    const std = entries.filter(([p]) => !isExt(p)).sort(byPath).map(line);
    const ext = entries.filter(([p]) => isExt(p)).sort(byPath).map(line);
    const groups = [std, ext].filter((g) => g.length > 0);
    return `import (\n${groups.map((g) => g.join('\n')).join('\n\n')}\n)`;
  }
}

function lastSegment(path: string): string {
  const seg = path.split('/').pop() || path;
  return seg;
}

function byPath(a: [string, unknown], b: [string, unknown]): number {
  return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
}

/** Assemble a complete Go file: package clause + imports + declarations. */
export function goFile(pkg: string, imports: Imports, decls: string[]): string {
  const parts = [`package ${pkg}`];
  if (imports.size > 0) parts.push(imports.render());
  parts.push(...decls.filter(Boolean));
  return `${parts.join('\n\n')}\n`;
}

/** A Go doc comment block (`// ...`) from free text, or '' when empty. */
export function goDoc(text: string | undefined, symbol?: string): string {
  const raw = (text || '').trim();
  if (!raw && !symbol) return '';
  const body = raw || `${symbol} ...`;
  return body
    .split('\n')
    .map((l) => (l.trim() ? `// ${l.trim()}` : '//'))
    .join('\n');
}

/** A Go struct declaration with pre-rendered `<name> <type> <tag?>` field lines. */
export function goStruct(name: string, fields: string[], doc = ''): string {
  const head = doc ? `${doc}\n` : '';
  if (fields.length === 0) return `${head}type ${name} struct{}`;
  const body = fields.map((f) => `${TAB}${f}`).join('\n');
  return `${head}type ${name} struct {\n${body}\n}`;
}

/** A raw Go struct field line: `Name Type \`tag\``. */
export function goField(name: string, type: string, tag?: string): string {
  return tag ? `${name} ${type} ${'`'}${tag}${'`'}` : `${name} ${type}`;
}
