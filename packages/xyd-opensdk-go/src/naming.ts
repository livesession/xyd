/** Split an identifier (camel/snake/kebab/space/dot) into lowercase words. */
export function splitWords(input: string): string[] {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/) // split on ANY non-alphanumeric so wire junk (e.g. `project_ids[]`) can't leak into a Go identifier
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
}

// Go naming convention: common initialisms are fully uppercased (golint/staticcheck).
const INITIALISMS = new Set([
  'acl', 'api', 'ascii', 'cpu', 'css', 'dns', 'eof', 'guid', 'html', 'http', 'https', 'id',
  'ip', 'json', 'lhs', 'os', 'qps', 'ram', 'rhs', 'rpc', 'sdk', 'sla', 'smtp', 'sql', 'ssh',
  'tcp', 'tls', 'ttl', 'udp', 'ui', 'uid', 'uuid', 'uri', 'url', 'utf8', 'vm', 'xml', 'xmpp',
]);

function capitalizeWord(word: string): string {
  if (INITIALISMS.has(word)) return word.toUpperCase();
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** Exported Go identifier, e.g. "pet_id" → "PetID", "has_more" → "HasMore". */
export function pascalCase(input: string): string {
  return splitWords(input).map(capitalizeWord).join('');
}

// Words the suffix rules below would mangle (uncountables in API surfaces).
const UNCOUNTABLE = new Set(['data', 'media', 'series']);

/**
 * Singularize one lowercase english word, tuned for resource segments the way
 * Stainless/openai-go names types: completions→completion, batches→batch,
 * responses→response, companies→company. Non-plural s-endings pass through
 * (address, status, analysis).
 */
export function singularize(word: string): string {
  if (word.length < 3 || UNCOUNTABLE.has(word)) return word;
  if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`;
  // classes→class, boxes→box, batches→batch, brushes→brush, statuses→status
  if (/(?:sses|xes|ches|shes|uses)$/.test(word) && word.length > 4) return word.slice(0, -2);
  // keep 'ss'/'us'/'is' endings — they are not plural markers
  if (/(?:ss|us|is)$/.test(word)) return word;
  if (word.endsWith('s')) return word.slice(0, -1);
  return word;
}

/**
 * PascalCase a resource segment with its TRAILING word singularized — the
 * openai-go TYPE-name shape ("videos"→Video, "vector-stores"→VectorStore,
 * "fine-tuning"→FineTuning). Field/file/wire names keep the plural.
 */
export function singularPascalCase(input: string): string {
  const words = splitWords(input);
  if (words.length === 0) return '';
  const last = words.length - 1;
  return words.map((w, i) => capitalizeWord(i === last ? singularize(w) : w)).join('');
}

/** lowerCamelCase Go identifier (function arg / local), e.g. "pet_id" → "petID". */
export function goVar(input: string): string {
  const words = splitWords(input);
  if (words.length === 0) return 'arg';
  const first = words[0];
  const head = INITIALISMS.has(first) ? first : first.charAt(0).toLowerCase() + first.slice(1);
  let name = head + words.slice(1).map(capitalizeWord).join('');
  if (GO_KEYWORDS.has(name)) name = `${name}_`;
  return name;
}

/** A Go package name: lowercase alphanumerics only, e.g. "My API v2" → "myapiv2". */
export function goPackageName(input: string): string {
  const joined = splitWords(input).join('');
  const clean = joined.replace(/[^a-z0-9]/g, '');
  return clean || 'client';
}

/** SCREAMING_SNAKE_CASE, e.g. "petstore" → "PETSTORE". */
export function screamingSnakeCase(input: string): string {
  return splitWords(input).join('_').toUpperCase().replace(/[^A-Z0-9_]/g, '');
}

/** kebab-case slug, e.g. "My API" → "my-api". */
export function slug(input: string): string {
  return splitWords(input).join('-').replace(/[^a-z0-9-]/g, '');
}

/**
 * Map an IR method action to an idiomatic Go method name, matching openai-go /
 * Stainless: create→New, list→List, retrieve→Get, update→Update, delete→Delete,
 * everything else → PascalCase(action).
 */
export function goMethodName(action: string): string {
  switch (action) {
    case 'create':
      return 'New';
    case 'retrieve':
      return 'Get';
    default:
      return pascalCase(action);
  }
}

const GO_KEYWORDS = new Set([
  'break', 'case', 'chan', 'const', 'continue', 'default', 'defer', 'else', 'fallthrough',
  'for', 'func', 'go', 'goto', 'if', 'import', 'interface', 'map', 'package', 'range',
  'return', 'select', 'struct', 'switch', 'type', 'var',
]);
