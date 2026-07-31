// A small string-emitting Rust writer (no Rust toolchain). Indents nested bodies
// and renders `/// ...` doc comments — the Rust analogue of the Go emitter's
// gowriter / the Ruby emitter's rbwriter, kept intentionally tiny.

/** Indent every non-empty line of `text` by `spaces` (blank lines stay blank). */
export function indent(text: string, spaces = 4): string {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => (line.length ? pad + line : line))
    .join('\n');
}

/** A Rust `/// ...` doc-comment block from free text, or '' when empty. */
export function rsDoc(text: string | undefined): string {
  const raw = (text || '').trim();
  if (!raw) return '';
  return raw
    .split('\n')
    .map((line) => (line.trim() ? `/// ${line.trim()}` : '///'))
    .join('\n');
}

/** A Rust double-quoted string literal (JSON escaping is Rust-compatible for our inputs). */
export function rsString(value: string): string {
  return JSON.stringify(value);
}

/** A `#[derive(...)]` attribute line for the given trait list. */
export function deriveLine(traits: string[]): string {
  return `#[derive(${traits.join(', ')})]`;
}

/** Wrap `body` in a `<header> {\n  <body>\n}` block (struct/impl/enum/fn). */
export function braced(header: string, body: string): string {
  if (!body.trim()) return `${header} {}`;
  return `${header} {\n${indent(body)}\n}`;
}
