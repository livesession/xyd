import type { CliSurface, FlagKind, SurfaceCommand, SurfaceFlag } from '../src/surface';

// Tolerant parser of openai-cli's Go source (urfave/cli v3, Stainless-generated):
// the registry `pkg/cmd/cmd.go` builds the root command whose Commands are
// `:`-namespaced resources (e.g. "chat:completions:messages") grouping action
// vars (`&modelsRetrieve`) defined across `pkg/cmd/*.go`. Path params are
// `requestflag.Flag[T]{ PathParam: "..." }` flags. We reduce all of that to a
// canonical CliSurface for diffing against our OpenCLI output.

interface Node {
  name: string;
  flags: SurfaceFlag[];
  children: Node[];
}

/** Extract the content between `{` at `openIdx` and its matching `}`. */
function braceBlock(src: string, openIdx: number): { inner: string; end: number } {
  let depth = 0;
  let inStr = false;
  let strCh = '';
  for (let i = openIdx; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (ch === '\\' && strCh === '"') {
        i++;
        continue;
      }
      if (ch === strCh) inStr = false;
      continue;
    }
    if (ch === '"' || ch === '`' || ch === "'") {
      inStr = true;
      strCh = ch;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return { inner: src.slice(openIdx + 1, i), end: i };
    }
  }
  return { inner: src.slice(openIdx + 1), end: src.length };
}

/** Split struct-literal fields / slice elements at brace/bracket/paren/string depth 0. */
function splitTopLevel(inner: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let inStr = false;
  let strCh = '';
  let cur = '';
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (inStr) {
      cur += ch;
      if (ch === '\\' && strCh === '"') {
        cur += inner[i + 1] ?? '';
        i++;
        continue;
      }
      if (ch === strCh) inStr = false;
      continue;
    }
    if (ch === '"' || ch === '`' || ch === "'") {
      inStr = true;
      strCh = ch;
      cur += ch;
      continue;
    }
    if (ch === '{' || ch === '[' || ch === '(') depth++;
    else if (ch === '}' || ch === ']' || ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur);
  return parts;
}

function parseFields(inner: string): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const part of splitTopLevel(inner)) {
    const m = part.match(/^\s*(\w+)\s*:\s*([\s\S]*)$/);
    if (m) fields[m[1]] = m[2].trim();
  }
  return fields;
}

function unquote(raw: string | undefined): string {
  if (!raw) return '';
  const s = raw.trim();
  if (s.startsWith('"')) {
    try {
      return JSON.parse(s.slice(0, s.lastIndexOf('"') + 1));
    } catch {
      return s.replace(/^"|"$/g, '');
    }
  }
  if (s.startsWith('`')) return s.slice(1, s.lastIndexOf('`'));
  return s;
}

/** Pull the `{...}` inner from a `[]T{...}` field value. */
function sliceInner(value: string | undefined): string | null {
  if (!value) return null;
  const open = value.indexOf('{');
  if (open === -1) return null;
  return braceBlock(value, open).inner;
}

function parseFlags(flagsValue: string | undefined): SurfaceFlag[] {
  const inner = sliceInner(flagsValue);
  if (!inner) return [];
  const flags: SurfaceFlag[] = [];
  for (const el of splitTopLevel(inner)) {
    const fieldsInner = sliceInner(el);
    if (!fieldsInner) continue;
    const f = parseFields(fieldsInner);
    const name = unquote(f.Name);
    if (!name) continue;
    const required = /^\s*true\b/.test(f.Required || '');
    const isPath = f.PathParam !== undefined;
    const kind: FlagKind = isPath ? 'path' : 'unknown';
    flags.push({ name, required, kind });
  }
  return flags;
}

function buildVarMap(files: Record<string, string>): Map<string, string> {
  const map = new Map<string, string>();
  const re = /var\s+(\w+)\s*=\s*cli\.Command\s*\{/g;
  for (const src of Object.values(files)) {
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(src))) {
      const open = src.indexOf('{', m.index + m[0].length - 1);
      const { inner } = braceBlock(src, open);
      map.set(m[1], inner);
    }
  }
  return map;
}

function parseNode(blockInner: string, varMap: Map<string, string>, seen: Set<string>): Node {
  const fields = parseFields(blockInner);
  const name = unquote(fields.Name);
  const flags = parseFlags(fields.Flags);
  const children: Node[] = [];

  const cmdsInner = sliceInner(fields.Commands);
  if (cmdsInner) {
    for (const el of splitTopLevel(cmdsInner)) {
      const ref = el.match(/^\s*&?(\w+)\s*$/);
      if (ref && varMap.has(ref[1])) {
        if (seen.has(ref[1])) continue;
        seen.add(ref[1]);
        children.push(parseNode(varMap.get(ref[1])!, varMap, seen));
      } else if (el.includes('{')) {
        const open = el.indexOf('{');
        children.push(parseNode(braceBlock(el, open).inner, varMap, seen));
      }
    }
  }

  return { name, flags, children };
}

function findRoot(files: Record<string, string>, varMap: Map<string, string>): string | null {
  for (const src of Object.values(files)) {
    const m = src.match(/Command\s*=\s*&?cli\.Command\s*\{/);
    if (m && m.index !== undefined) {
      const open = src.indexOf('{', m.index + m[0].length - 1);
      return braceBlock(src, open).inner;
    }
  }
  // Fallback: a var named exactly the root binary, if present.
  return null;
}

function emit(node: Node, prefix: string[], out: SurfaceCommand[]) {
  const segments = node.name ? node.name.split(/[:\s]+/).filter(Boolean) : [];
  const path = [...prefix, ...segments];
  if (node.children.length) {
    for (const c of node.children) emit(c, path, out);
  } else if (path.length) {
    out.push({ path, flags: [...node.flags].sort((a, b) => a.name.localeCompare(b.name)) });
  }
}

/** Parse openai-cli Go source (file map) into the canonical CLI surface. */
export function parseOpenaiCli(files: Record<string, string>): CliSurface {
  const varMap = buildVarMap(files);
  const rootInner = findRoot(files, varMap);
  if (!rootInner) return { commands: [] };

  const root = parseNode(rootInner, varMap, new Set());
  const out: SurfaceCommand[] = [];
  // The root itself is the binary ("openai"); start paths from its children.
  for (const child of root.children) emit(child, [], out);
  out.sort((a, b) => a.path.join(' ').localeCompare(b.path.join(' ')));
  return { commands: out };
}
