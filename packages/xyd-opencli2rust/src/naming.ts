// Rust naming helpers, mirroring xyd-opensdk-rust's naming.ts (plus `slug` from
// xyd-opencli2go). Copied by repo convention: generators own their emission helpers.

/** Split an identifier (camel/snake/kebab/space/dot) into lowercase words. */
export function splitWords(input: string): string[] {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/) // split on ANY non-alphanumeric so wire junk (e.g. `ids[]`) can't leak into an identifier
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
}

/** Prefix `_` when an identifier would start with a digit (illegal as a bare Rust name). */
function safeIdent(s: string): string {
  return /^[0-9]/.test(s) ? `_${s}` : s;
}

/** PascalCase for Rust structs/enums/variants, e.g. "pet-list" -> "PetList". */
export function pascalCase(input: string): string {
  const s = splitWords(input)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
  return safeIdent(s) || 'Value';
}

/** snake_case for Rust modules/fields/fns, keyword-guarded with a trailing `_`. */
export function snakeCase(input: string): string {
  const s = safeIdent(splitWords(input).join('_')) || 'field';
  return RUST_KEYWORDS.has(s) ? `${s}_` : s;
}

/** SCREAMING_SNAKE_CASE env-var prefix, e.g. "sample-api" -> "SAMPLE_API". */
export function screamingSnakeCase(input: string): string {
  return safeIdent(splitWords(input).join('_').toUpperCase().replace(/[^A-Z0-9_]/g, '')) || 'VALUE';
}

/** A Cargo package name (snake_case, alnum + underscore), e.g. "My API" -> "my_api". */
export function crateName(input: string): string {
  const s = splitWords(input).join('_').replace(/[^a-z0-9_]/g, '');
  return safeIdent(s) || 'cli';
}

/** Slug for a binary name, e.g. "Sample API" -> "sample-api". */
export function slug(input: string): string {
  return splitWords(input).join('-').replace(/[^a-z0-9-]/g, '');
}

/** Reserved + weak Rust keywords that can never be a bare identifier. */
const RUST_KEYWORDS = new Set([
  'as', 'break', 'const', 'continue', 'crate', 'dyn', 'else', 'enum', 'extern', 'false', 'fn', 'for',
  'if', 'impl', 'in', 'let', 'loop', 'match', 'mod', 'move', 'mut', 'pub', 'ref', 'return', 'self',
  'static', 'struct', 'super', 'trait', 'true', 'type', 'unsafe', 'use', 'where', 'while', 'async',
  'await', 'abstract', 'become', 'box', 'do', 'final', 'macro', 'override', 'priv', 'typeof', 'unsized',
  'virtual', 'yield', 'try', 'union',
]);
