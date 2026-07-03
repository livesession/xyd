// A small string-emitting Ruby writer (no Ruby toolchain). Indents nested
// module/class bodies and renders `# ...` doc comments — the Ruby analogue of
// the Go emitter's gowriter, kept intentionally tiny.

/** Indent every non-empty line of `text` by `spaces` (blank lines stay blank). */
export function indent(text: string, spaces = 2): string {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => (line.length ? pad + line : line))
    .join('\n');
}

/** A Ruby `# ...` comment block from free text, or '' when empty. */
export function rbComment(text: string | undefined): string {
  const raw = (text || '').trim();
  if (!raw) return '';
  return raw
    .split('\n')
    .map((line) => (line.trim() ? `# ${line.trim()}` : '#'))
    .join('\n');
}

/** Wrap `body` in a `<header>\n  <body>\nend` block (module/class/def). */
export function block(header: string, body: string): string {
  return `${header}\n${indent(body)}\nend`;
}

/** A Ruby double-quoted string literal (JSON escaping is Ruby-compatible for our inputs). */
export function rbString(value: string): string {
  return JSON.stringify(value);
}
