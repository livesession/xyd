import type { OpenAPIV3 } from 'openapi-types';
import type { XOpenApiResponse } from '@xyd-js/opencli';

import { arrayItems, getDefault, mergeAllOf, type Schema } from './schema';
import type { OpenApi2OpenCliOptions } from './types';

// Cap recursion so deep/recursive (dereferenced, possibly circular) response
// schemas can't produce an unbounded example.
const MAX_SAMPLE_DEPTH = 8;

/** True for a JSON-ish media type the schema sampler can faithfully represent. */
function isJsonMediaType(mediaType: string): boolean {
  return mediaType === 'application/json' || mediaType.endsWith('+json');
}

/** Pick the response media type to render (prefer JSON). */
function pickResponseContent(
  content: { [media: string]: OpenAPIV3.MediaTypeObject } | undefined,
): { mediaType: string; media: OpenAPIV3.MediaTypeObject } | undefined {
  if (!content) return undefined;
  const keys = Object.keys(content);
  if (!keys.length) return undefined;
  const json = keys.find((k) => k === 'application/json') || keys.find((k) => k.endsWith('+json'));
  const mediaType = json || keys[0];
  return { mediaType, media: content[mediaType] };
}

/**
 * A representative example value for a (dereferenced) response schema — curated
 * `example`/`default`/`enum` win, then per-type placeholders. Kept self-contained
 * (no external sampler dep) and bounded by depth.
 */
function sampleFromSchema(schema: Schema | undefined, depth = 0): unknown {
  if (!schema || depth > MAX_SAMPLE_DEPTH) return undefined;

  if ((schema as { example?: unknown }).example !== undefined) return (schema as { example?: unknown }).example;
  const def = getDefault(schema);
  if (def !== undefined) return def;
  if (Array.isArray(schema.enum) && schema.enum.length) return schema.enum[0];

  const merged = mergeAllOf(schema) ?? schema;

  const branches = (merged.oneOf || merged.anyOf) as Schema[] | undefined;
  if (Array.isArray(branches) && branches.length) return sampleFromSchema(branches[0], depth + 1);

  if (merged.type === 'array') {
    const item = sampleFromSchema(arrayItems(merged), depth + 1);
    return item === undefined ? [] : [item];
  }

  if (merged.type === 'object' || merged.properties) {
    const obj: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(merged.properties || {})) {
      if (key.startsWith('__')) continue; // dereferencer markers (__UNSAFE_*)
      const value = sampleFromSchema(raw as Schema, depth + 1);
      if (value !== undefined) obj[key] = value;
    }
    return obj;
  }

  switch (merged.type) {
    case 'string':
      return merged.format ? `<${merged.format}>` : 'string';
    case 'integer':
    case 'number':
      return 0;
    case 'boolean':
      return true;
    default:
      return undefined;
  }
}

/**
 * The concrete example body for a response media object. A curated `example` /
 * named example wins; otherwise the schema is sampled only for JSON-ish media
 * types (the sampler produces JSON-shaped values, so sampling an XML/binary body
 * would be misleading).
 */
function exampleFor(media: OpenAPIV3.MediaTypeObject, jsonish: boolean): unknown {
  if (media.example !== undefined) return media.example;
  const named = media.examples;
  if (named && typeof named === 'object') {
    const first = Object.values(named)[0] as OpenAPIV3.ExampleObject | undefined;
    if (first && 'value' in first && first.value !== undefined) return first.value;
  }
  return jsonish ? sampleFromSchema(media.schema as Schema | undefined) : undefined;
}

/**
 * Map an operation's success responses to the `x-openapi.responses` binding so
 * api.cli pages can render a response sample (mirrors the OpenAPI response
 * example track). Captures the 2xx responses that carry content; falls back to
 * the `default` response, then the first response with content. Only the example
 * is emitted (not the full schema) to keep generated OpenCLI docs lean.
 */
export function mapResponses(
  responses: OpenAPIV3.ResponsesObject | undefined,
  _options: OpenApi2OpenCliOptions,
): XOpenApiResponse[] {
  if (!responses) return [];

  const withContent = Object.entries(responses).filter(
    ([, r]) => r && typeof r === 'object' && (r as OpenAPIV3.ResponseObject).content,
  ) as [string, OpenAPIV3.ResponseObject][];
  if (!withContent.length) return [];

  // 2xx (incl. the OpenAPI "2XX" range wildcard) is success; else the documented
  // `default`; else the first content-bearing response.
  const success = withContent.filter(([status]) => /^2(\d\d|XX)$/i.test(status)).sort(([a], [b]) => a.localeCompare(b));
  const fallback = withContent.filter(([status]) => status === 'default');
  const chosen = success.length ? success : fallback.length ? fallback : [withContent[0]];

  const out: XOpenApiResponse[] = [];
  for (const [status, response] of chosen) {
    const picked = pickResponseContent(response.content);
    if (!picked) continue;
    const example = exampleFor(picked.media, isJsonMediaType(picked.mediaType));
    if (example === undefined || example === null) continue;

    const res: XOpenApiResponse = { status, contentType: picked.mediaType };
    if (response.description) res.description = response.description;
    res.example = example;
    out.push(res);
  }
  return out;
}
