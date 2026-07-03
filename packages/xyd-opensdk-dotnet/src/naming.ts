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

/** Prefix `_` when an identifier would start with a digit (illegal in C#). */
function safeIdent(s: string): string {
  return /^[0-9]/.test(s) ? `_${s}` : s;
}

/**
 * PascalCase C# identifier, e.g. "pet_id" -> "PetId", "has_more" -> "HasMore".
 * .NET style keeps initialisms Pascal-cased ("Id", not "ID").
 */
export function pascalCase(input: string): string {
  return safeIdent(splitWords(input).map(capitalize).join(''));
}

/** lowerCamelCase C# identifier (method arg / local), e.g. "pet_id" -> "petId". */
export function camelCase(input: string): string {
  const words = splitWords(input);
  if (words.length === 0) return 'arg';
  const head = words[0];
  const name = safeIdent(head + words.slice(1).map(capitalize).join(''));
  return CS_KEYWORDS.has(name) ? `@${name}` : name;
}

/** SCREAMING_SNAKE_CASE, e.g. "petstore" -> "PETSTORE" (enum members: `_` prefix if digit-leading). */
export function screamingSnakeCase(input: string): string {
  return safeIdent(splitWords(input).join('_').toUpperCase().replace(/[^A-Z0-9_]/g, ''));
}

/** kebab-lowercase token, e.g. "PetId" -> "pet-id" — used for collision-safe fixture dir names. */
export function slug(input: string): string {
  return splitWords(input).join('-').replace(/[^a-z0-9-]/g, '');
}

/** Allocate a unique identifier from `base`, suffixing `Value`/`Value2`… on collision. */
function allocIdent(base: string, used: Set<string>): string {
  let name = base;
  if (used.has(name)) {
    name = `${base}Value`;
    for (let i = 2; used.has(name); i++) name = `${base}Value${i}`;
  }
  used.add(name);
  return name;
}

/**
 * Map each struct field wire-name -> its C# property identifier, resolving the two
 * C#-only hazards that Go/Python don't hit (Go allows a field named like its
 * struct; Python uses snake_case attrs): a property named the SAME as its
 * enclosing type (CS0542) and two fields whose PascalCase collides (CS0102). The
 * wire name stays on `[JsonPropertyName]`, so only the C# identifier changes. Used
 * by BOTH the model declaration and every property reference (object initializers,
 * multipart body maps) so they agree byte-for-byte.
 */
export function structPropertyNames(pascalTypeName: string, fieldNames: readonly string[]): Map<string, string> {
  const used = new Set<string>([pascalTypeName]); // reserve the enclosing type name (CS0542)
  const out = new Map<string, string>();
  for (const fn of fieldNames) out.set(fn, allocIdent(pascalCase(fn) || 'Value', used));
  return out;
}

/**
 * Map an IR method action to an idiomatic C# method name — PascalCase of the
 * action verb (list -> List, create -> Create, retrieve -> Retrieve,
 * download_photo -> DownloadPhoto). Mirrors openai-dotnet's PascalCase methods;
 * unlike Go we do NOT remap create->New / retrieve->Get.
 */
export function methodName(action: string): string {
  return pascalCase(action) || 'Invoke';
}

const CS_KEYWORDS = new Set([
  'abstract', 'as', 'base', 'bool', 'break', 'byte', 'case', 'catch', 'char', 'checked', 'class',
  'const', 'continue', 'decimal', 'default', 'delegate', 'do', 'double', 'else', 'enum', 'event',
  'explicit', 'extern', 'false', 'finally', 'fixed', 'float', 'for', 'foreach', 'goto', 'if',
  'implicit', 'in', 'int', 'interface', 'internal', 'is', 'lock', 'long', 'namespace', 'new',
  'null', 'object', 'operator', 'out', 'override', 'params', 'private', 'protected', 'public',
  'readonly', 'ref', 'return', 'sbyte', 'sealed', 'short', 'sizeof', 'stackalloc', 'static',
  'string', 'struct', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'uint', 'ulong',
  'unchecked', 'unsafe', 'ushort', 'using', 'virtual', 'void', 'volatile', 'while',
]);
