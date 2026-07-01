// Build the oracle from OpenAI's published API reference (developers.openai.com):
// the overview page lists every method (with its HTTP verb + URL), and each CLI
// doc page shows the canonical `openai …` invocation. This gives a clean,
// per-method expected CLI surface to test our OpenAPI → OpenCLI conversion against.

export interface DocsMethod {
  /** e.g. ["audio","transcriptions","create"] — derived from the doc URL. */
  commandPath: string[];
  /** lowercase HTTP verb from the overview's data-stldocs-method. */
  httpMethod: string;
  /** the reference (HTTP) doc path. */
  href: string;
  /** absolute CLI doc page URL. */
  cliUrl: string;
}

export interface DocsMethodResolved extends DocsMethod {
  /** the raw `openai …` command from the CLI doc snippet (one line). */
  docCommand: string;
  /** non-global flags shown in the snippet (the command-specific example flags). */
  docFlags: string[];
}

// Root/global flags from openai-cli's cmd.go — excluded from per-command flags.
export const GLOBAL_FLAGS = new Set([
  'api-key',
  'admin-api-key',
  'base-url',
  'format',
  'format-error',
  'transform',
  'transform-error',
  'raw-output',
  'organization',
  'project',
  'webhook-secret',
  'debug',
  'version',
  'help',
]);

const DOCS_ORIGIN = 'https://developers.openai.com';

export function commandPathFromHref(href: string): string[] {
  return href
    .replace('/api/reference/resources/', '')
    .replace(/\/subresources\//g, '/')
    .replace('/methods/', '/')
    .split('/')
    .filter(Boolean)
    .map((s) => s.replace(/_/g, '-'));
}

export function cliUrlFromHref(href: string): string {
  return DOCS_ORIGIN + href.replace('/api/reference/resources/', '/api/reference/cli/resources/');
}

/** Parse the overview page into the list of methods (deduped by href). */
export function parseOverviewMethods(html: string): DocsMethod[] {
  const re =
    /href="(\/api\/reference\/resources\/[a-z0-9/_-]+\/methods\/[a-z0-9_-]+)"\s+data-stldocs-method="([a-z]+)"/g;
  const seen = new Set<string>();
  const out: DocsMethod[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const href = m[1];
    if (seen.has(href)) continue;
    seen.add(href);
    out.push({ commandPath: commandPathFromHref(href), httpMethod: m[2], href, cliUrl: cliUrlFromHref(href) });
  }
  out.sort((a, b) => a.commandPath.join(' ').localeCompare(b.commandPath.join(' ')));
  return out;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

/** Extract the `openai …` command (and its flags) from a CLI doc page. */
export function extractCliCommand(html: string): { command: string; flags: string[] } | null {
  const codes = [...html.matchAll(/<code>([\s\S]*?)<\/code>/g)].map((m) =>
    decodeEntities(m[1].replace(/<[^>]+>/g, '')),
  );
  const raw = codes.find((c) => /^\s*openai\s/.test(c));
  if (!raw) return null;
  const command = raw
    .replace(/\\\s*\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const flags = [...command.matchAll(/--[a-z][a-z0-9-]*/g)].map((m) => m[0].slice(2));
  return { command, flags };
}

/** Command-specific (non-global) flags from a snippet's flag list. */
export function commandFlags(flags: string[]): string[] {
  return [...new Set(flags.filter((f) => !GLOBAL_FLAGS.has(f)))].sort();
}

// ---- Joining docs methods to OpenAPI operations --------------------------

export interface SpecOp {
  method: string;
  path: string;
  operationId?: string;
  title?: string;
}

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];

/** A path with its `{param}` segments removed and `_` → `-`, for fuzzy matching. */
function paramlessKey(method: string, p: string): string {
  const segs = p.split('/').filter((s) => s && !/^\{.*\}$/.test(s));
  return `${method} /${segs.join('/').replace(/_/g, '-')}`;
}

/** Index a (dereferenced or raw) OpenAPI doc's operations by a paramless verb+path key. */
export function buildOpIndex(spec: any): Map<string, SpecOp> {
  const index = new Map<string, SpecOp>();
  for (const [p, item] of Object.entries(spec.paths || {})) {
    for (const method of HTTP_METHODS) {
      const op = (item as any)?.[method];
      if (!op) continue;
      const key = paramlessKey(method, p);
      if (!index.has(key)) {
        index.set(key, { method, path: p, operationId: op.operationId, title: op['x-oaiMeta']?.name });
      }
    }
  }
  return index;
}

/**
 * Resolve a docs method (command path + HTTP verb) to its OpenAPI operation by
 * paramless path matching, tolerating Stainless `admin`/`beta` resource prefixes.
 */
export function joinDocsMethod(commandPath: string[], httpMethod: string, index: Map<string, SpecOp>): SpecOp | null {
  const resource = commandPath.slice(0, -1);
  const variants = [resource];
  if (resource[0] === 'admin') variants.push(resource.slice(1));
  if (resource[0] === 'beta') variants.push(resource.slice(1));
  for (const r of variants) {
    const hit = index.get(`${httpMethod} /${r.join('/')}`);
    if (hit) return hit;
  }
  return null;
}
