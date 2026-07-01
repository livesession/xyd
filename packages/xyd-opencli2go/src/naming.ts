/** Split an identifier (camel/snake/kebab/space) into lowercase words. */
export function splitWords(input: string): string[] {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[\s_\-./]+/)
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
}

/** PascalCase, e.g. "chat-completions" → "ChatCompletions". */
export function pascalCase(input: string): string {
  return splitWords(input)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

/** lowerCamelCase Go variable name, e.g. "store-id" → "storeID". */
export function goVar(input: string): string {
  const pascal = pascalCase(input);
  if (!pascal) return 'arg';
  let name = pascal.charAt(0).toLowerCase() + pascal.slice(1);
  // Common Go initialism cleanup for ergonomics.
  name = name.replace(/Id\b/g, 'ID').replace(/Url\b/g, 'URL').replace(/Api\b/g, 'API');
  // Avoid Go keywords.
  if (GO_KEYWORDS.has(name)) name = `${name}_`;
  return name;
}

/** Slug for a binary / module name. */
export function slug(input: string): string {
  return splitWords(input).join('-').replace(/[^a-z0-9-]/g, '');
}

/** SCREAMING_SNAKE_CASE env-var prefix. */
export function screamingSnakeCase(input: string): string {
  return splitWords(input).join('_').toUpperCase().replace(/[^A-Z0-9_]/g, '');
}

const GO_KEYWORDS = new Set([
  'break', 'case', 'chan', 'const', 'continue', 'default', 'defer', 'else', 'fallthrough',
  'for', 'func', 'go', 'goto', 'if', 'import', 'interface', 'map', 'package', 'range',
  'return', 'select', 'struct', 'switch', 'type', 'var',
]);
