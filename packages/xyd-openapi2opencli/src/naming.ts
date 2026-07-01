/**
 * Split an identifier (camelCase, snake_case, kebab-case, space separated)
 * into lowercase words.
 */
export function splitWords(input: string): string[] {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // camelCase boundary
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // ACRONYMBoundary
    .split(/[\s_\-./]+/)
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
}

/** kebab-case a wire name (e.g. `completionId` → `completion-id`, `max_tokens` → `max-tokens`). */
export function kebabCase(input: string): string {
  return splitWords(input).join('-');
}

/** camelCase a wire name. */
export function camelCase(input: string): string {
  const words = splitWords(input);
  return words
    .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join('');
}

/** SCREAMING_SNAKE_CASE (used for env var names). */
export function screamingSnakeCase(input: string): string {
  return splitWords(input).join('_').toUpperCase();
}

/**
 * Slugify a free-form title into a CLI binary name (lowercase, dash separated,
 * alnum only). e.g. "OpenAI API" → "openai-api".
 */
export function slug(input: string): string {
  return splitWords(input)
    .join('-')
    .replace(/[^a-z0-9-]/g, '');
}
