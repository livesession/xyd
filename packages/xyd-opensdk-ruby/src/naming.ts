/** Split an identifier (camel/snake/kebab/space/dot) into lowercase words. */
export function splitWords(input: string): string[] {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/) // split on ANY non-alphanumeric so wire junk (e.g. `ids[]`) can't leak into an identifier
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
}

/** Prefix `_` when an identifier would start with a digit (illegal as a bare Ruby name). */
function safeIdent(s: string): string {
  return /^[0-9]/.test(s) ? `_${s}` : s;
}

/** PascalCase for Ruby classes/modules/constants, e.g. "pet-list" -> "PetList". */
export function pascalCase(input: string): string {
  const s = splitWords(input)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
  return safeIdent(s);
}

/** snake_case for Ruby methods/files/locals, e.g. "petId" -> "pet_id" (keyword-guarded). */
export function snakeCase(input: string): string {
  const s = safeIdent(splitWords(input).join('_'));
  return RUBY_KEYWORDS.has(s) ? `${s}_` : s;
}

/** SCREAMING_SNAKE_CASE for enum members / env vars, e.g. "petStatus" -> "PET_STATUS". */
export function screamingSnakeCase(input: string): string {
  return safeIdent(splitWords(input).join('_').toUpperCase().replace(/[^A-Z0-9_]/g, ''));
}

/** A Ruby gem/package name (snake_case, alnum + underscore), e.g. "My API" -> "my_api". */
export function rubyGemName(input: string): string {
  const s = splitWords(input).join('_').replace(/[^a-z0-9_]/g, '');
  return s || 'client';
}

/**
 * The idiomatic Ruby method name for an IR action. openai-ruby keeps the verb
 * as-is (`create`, `retrieve`, `list`, `update`, `delete`), so a snake_cased
 * action is already the native name; keyword collisions are guarded.
 */
export function rubyMethodName(action: string): string {
  return snakeCase(action);
}

const RUBY_KEYWORDS = new Set([
  'alias', 'and', 'begin', 'break', 'case', 'class', 'def', 'defined', 'do', 'else', 'elsif',
  'end', 'ensure', 'false', 'for', 'if', 'in', 'module', 'next', 'nil', 'not', 'or', 'redo',
  'rescue', 'retry', 'return', 'self', 'super', 'then', 'true', 'undef', 'unless', 'until',
  'when', 'while', 'yield',
]);
