/** Split an identifier (camel/snake/kebab/space/dot) into lowercase words. */
export function splitWords(input: string): string[] {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/) // split on ANY non-alphanumeric so wire junk (e.g. `ids[]`) can't leak into an identifier
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** Prefix `_` when an identifier would start with a digit (illegal in Java). */
function safeIdent(s: string): string {
  return /^[0-9]/.test(s) ? `_${s}` : s;
}

/** PascalCase, e.g. "pet-list" -> "PetList", "has_more" -> "HasMore". */
export function pascalCase(input: string): string {
  return safeIdent(splitWords(input).map(capitalize).join(''));
}

/** lowerCamelCase Java identifier, e.g. "pet_id" -> "petId" (keyword-guarded). */
export function camelCase(input: string): string {
  const words = splitWords(input);
  if (words.length === 0) return 'value';
  const head = words[0];
  const name = safeIdent(head + words.slice(1).map(capitalize).join(''));
  return JAVA_KEYWORDS.has(name) ? `${name}_` : name;
}

// Words the suffix rules below would mangle (uncountables in API surfaces).
const UNCOUNTABLE = new Set(['data', 'media', 'series']);

/**
 * Singularize one lowercase english word, tuned for resource segments the way
 * Stainless/openai-* names service types: pets->pet, batches->batch,
 * companies->company. Non-plural s-endings pass through (address, status).
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
 * openai-java service-TYPE-name shape ("moderations"->Moderation,
 * "pets"->Pet, "project-roles"->ProjectRole). Field/accessor names keep the
 * plural (see `camelCase`).
 */
export function singularPascalCase(input: string): string {
  const words = splitWords(input);
  if (words.length === 0) return '';
  const last = words.length - 1;
  return safeIdent(words.map((w, i) => capitalize(i === last ? singularize(w) : w)).join(''));
}

/**
 * The globally-unique Java service qualifier for a resource, from its FULL path
 * (root..resource) with each segment SINGULARIZED, e.g. ["projects","roles"] ->
 * "ProjectRole". Type names are path-qualified so a nested `roles` never
 * collides with a top-level one (mirrors the Go/Python emitters).
 */
export function resourceQualifier(segments: string[]): string {
  return segments.map(singularPascalCase).join('');
}

/** The Java service class name for a resource at `segments`, e.g. "PetService". */
export function serviceTypeName(segments: string[]): string {
  return `${resourceQualifier(segments)}Service`;
}

/**
 * Map an IR method action to an idiomatic openai-java method name:
 * create/list/retrieve/update/delete pass through, everything else is
 * camelCased (download_photo -> downloadPhoto).
 */
export function javaMethodName(action: string): string {
  switch (action) {
    case 'create':
    case 'list':
    case 'retrieve':
    case 'update':
    case 'delete':
      return action;
    default:
      return camelCase(action);
  }
}

/** SCREAMING_SNAKE_CASE enum member, e.g. "available" -> "AVAILABLE" (digit-guarded). */
export function screamingSnakeCase(input: string): string {
  const s = splitWords(input).join('_').toUpperCase().replace(/[^A-Z0-9_]/g, '');
  return safeIdent(s) || 'VALUE';
}

/** A Java package segment: lowercase alphanumerics only, e.g. "My API v2" -> "myapiv2". */
export function javaPackageName(input: string): string {
  const clean = splitWords(input).join('').replace(/[^a-z0-9]/g, '');
  return clean || 'client';
}

/**
 * kebab-case slug, e.g. "My API" -> "my-api". Not used by the emitter itself —
 * the per-method fixture directories (docs.test.ts) name themselves by the
 * operation's own resource path + action through this, mirroring the Go
 * emitter's `slug`.
 */
export function slug(input: string): string {
  return splitWords(input).join('-').replace(/[^a-z0-9-]/g, '');
}

const JAVA_KEYWORDS = new Set([
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const',
  'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float',
  'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native',
  'new', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp',
  'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try', 'void',
  'volatile', 'while', 'true', 'false', 'null', 'var', 'record', 'yield',
]);
