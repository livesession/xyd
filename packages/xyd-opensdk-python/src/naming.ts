/** Split an identifier (camel/snake/kebab/space/dot) into lowercase words. */
export function splitWords(input: string): string[] {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/) // split on ANY non-alphanumeric so wire junk (e.g. `ids[]`) can't leak into an identifier
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
}

/** Prefix `_` when an identifier would start with a digit (illegal in Python). */
function safeIdent(s: string): string {
  return /^[0-9]/.test(s) ? `_${s}` : s;
}

/** PascalCase, e.g. "pet-list" → "PetList". */
export function pascalCase(input: string): string {
  const s = splitWords(input)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
  return safeIdent(s);
}

/** snake_case (Python identifiers), e.g. "petId" → "pet_id". */
export function snakeCase(input: string): string {
  const s = safeIdent(splitWords(input).join('_'));
  return PY_KEYWORDS.has(s) ? `${s}_` : s;
}

/** A Python module/package name: snake_case, alphanumerics + underscore only. */
export function pyModuleName(input: string): string {
  const s = splitWords(input).join('_').replace(/[^a-z0-9_]/g, '');
  return s || 'client';
}

/** SCREAMING_SNAKE_CASE, e.g. "petstore" → "PETSTORE" (enum members: `_` prefix if digit-leading). */
export function screamingSnakeCase(input: string): string {
  return safeIdent(splitWords(input).join('_').toUpperCase().replace(/[^A-Z0-9_]/g, ''));
}

const PY_KEYWORDS = new Set([
  'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif',
  'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda',
  'none', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
]);
