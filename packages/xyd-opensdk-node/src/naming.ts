/** Split an identifier (camel/snake/kebab/space/dot) into lowercase words. */
export function splitWords(input: string): string[] {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/) // split on ANY non-alphanumeric so wire junk (e.g. `ids[]`) can't leak into an identifier
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
}

/** Prefix `_` when an identifier would start with a digit (illegal in JS). */
function safeIdent(s: string): string {
  return /^[0-9]/.test(s) ? `_${s}` : s;
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** PascalCase, e.g. "pet-list" → "PetList", "create_pet_request" → "CreatePetRequest". */
export function pascalCase(input: string): string {
  return safeIdent(splitWords(input).map(capitalize).join(''));
}

/** lowerCamelCase (JS identifier / method / arg), e.g. "pet_id" → "petId". */
export function camelCase(input: string): string {
  const words = splitWords(input);
  if (words.length === 0) return 'arg';
  const name = safeIdent(words[0] + words.slice(1).map(capitalize).join(''));
  return JS_RESERVED.has(name) ? `${name}_` : name;
}

// Words the suffix rules below would mangle (uncountables in API surfaces).
const UNCOUNTABLE = new Set(['data', 'media', 'series']);

/**
 * Singularize one lowercase english word, tuned for resource segments the way
 * openai-node names param types: pets→pet, batches→batch, companies→company.
 * Non-plural s-endings pass through (address, status, analysis).
 */
export function singularize(word: string): string {
  if (word.length < 3 || UNCOUNTABLE.has(word)) return word;
  if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`;
  if (/(?:sses|xes|ches|shes|uses)$/.test(word) && word.length > 4) return word.slice(0, -2);
  if (/(?:ss|us|is)$/.test(word)) return word;
  if (word.endsWith('s')) return word.slice(0, -1);
  return word;
}

/**
 * PascalCase a resource segment with its TRAILING word singularized — the
 * openai-node param-type shape ("pets"→Pet, "vector-stores"→VectorStore).
 * Class/field/wire names keep the plural.
 */
export function singularPascalCase(input: string): string {
  const words = splitWords(input);
  if (words.length === 0) return '';
  const last = words.length - 1;
  return words.map((w, i) => capitalize(i === last ? singularize(w) : w)).join('');
}

/** kebab-case slug (resource file name), e.g. "Vector Stores" → "vector-stores". */
export function slug(input: string): string {
  return splitWords(input).join('-').replace(/[^a-z0-9-]/g, '');
}

/** SCREAMING_SNAKE_CASE, e.g. "petstore" → "PETSTORE" (env-var stems). */
export function screamingSnakeCase(input: string): string {
  return safeIdent(splitWords(input).join('_').toUpperCase().replace(/[^A-Z0-9_]/g, ''));
}

/** An npm-safe package name: kebab-case alphanumerics, e.g. "My API v2" → "my-api-v2". */
export function npmPackageName(input: string): string {
  const s = splitWords(input).join('-').replace(/[^a-z0-9-]/g, '');
  return s || 'client';
}

/**
 * Map an IR method action to an idiomatic TypeScript method name, matching
 * openai-node: the action verb in camelCase (create/list/retrieve/update/delete
 * kept verbatim; multi-word actions camelCased, e.g. download_photo →
 * downloadPhoto).
 */
export function nodeMethodName(action: string): string {
  return camelCase(action);
}

// Reserved words illegal as bare identifiers (method/arg names). Class methods
// may legally be named `delete`, so it is intentionally NOT here.
const JS_RESERVED = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'do', 'else',
  'enum', 'export', 'extends', 'false', 'finally', 'for', 'function', 'if', 'import', 'in',
  'instanceof', 'new', 'null', 'return', 'super', 'switch', 'this', 'throw', 'true', 'try',
  'typeof', 'var', 'void', 'while', 'with', 'yield',
]);
