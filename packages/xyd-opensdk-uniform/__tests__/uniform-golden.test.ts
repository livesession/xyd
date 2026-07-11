import fs from 'node:fs';
import path from 'node:path';

import type { Definition, Reference } from '@xyd-js/uniform';
import type { OpenAPIV3 } from 'openapi-types';
import { describe, expect, it } from 'vitest';

import { SDK_LANGS, attachSdkExamples, attachSdkTypes } from '../src/index';
import { buildGolden } from './goldenSerialize';

// The uniform.json GOLDEN. There is no golden anywhere for the bridge's OUTPUT —
// this builds one. It takes a small but representative RAW ($ref-carrying) OpenAPI
// doc, converts it into uniform References (curl request codeblock + REST
// definitions + OpenAPI context — exactly the shape the bridge matches), runs
// BOTH enrichers over them in place (attachSdkExamples → SDK code tabs;
// attachSdkTypes → SDK-native definition variants + context.sdk.signatures), and
// serializes ONLY the parts the SDK pipeline produces (per-language tab code, the
// Parameters/Returns variants, and the context.sdk block) to a committed golden.
//
// The current generated uniform is assumed correct (capture-once-as-golden):
//   - regenerate with O2S_BUILD_DOCS=1 (writes __fixtures__/1.sdk-uniform/uniform.json)
//   - the offline guard re-runs the enrichment and JSON-equals the committed golden.

const OUT_DIR = path.join(__dirname, '../__fixtures__/1.sdk-uniform');
const GOLDEN = path.join(OUT_DIR, 'uniform.json');

const BUILD = process.env.O2S_BUILD_DOCS === '1';

// A RAW ($ref-carrying — openapi2opensdk needs $ref identity) OpenAPI doc covering
// the shapes that matter: a POST-body create (required scalar + enum + array +
// nested $ref), a GET-query list, a GET path-param retrieve, and a CURSOR-paginated
// list (data[] + has_more envelope + `after` cursor query param).
const rawDoc: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: { title: 'Widget API', version: '1.0.0' },
  paths: {
    '/widgets': {
      // GET-query list (all-optional query params)
      get: {
        operationId: 'listWidgets',
        parameters: [{ name: 'q', in: 'query', required: false, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'ok',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Widget' } } } },
          },
        },
      },
      // POST-body create (required scalar + enum + array + nested $ref)
      post: {
        operationId: 'createWidget',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/WidgetCreate' } } },
        },
        responses: {
          '201': { description: 'created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Widget' } } } },
        },
      },
    },
    // GET path-param retrieve
    '/widgets/{widgetId}': {
      get: {
        operationId: 'getWidget',
        parameters: [{ name: 'widgetId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'ok', content: { 'application/json': { schema: { $ref: '#/components/schemas/Widget' } } } },
        },
      },
    },
    // CURSOR-paginated list (data[] + has_more + `after` cursor)
    '/widgets/paged': {
      get: {
        operationId: 'pageWidgets',
        parameters: [
          { name: 'after', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', example: 20 } },
        ],
        responses: {
          '200': { description: 'ok', content: { 'application/json': { schema: { $ref: '#/components/schemas/WidgetList' } } } },
        },
      },
    },
  },
  components: {
    schemas: {
      WidgetCreate: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive', 'archived'] },
          tags: { type: 'array', items: { type: 'string' } },
          owner: { $ref: '#/components/schemas/Owner' },
        },
      },
      Owner: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } },
      Widget: { type: 'object', required: ['id', 'name'], properties: { id: { type: 'string' }, name: { type: 'string' } } },
      WidgetList: {
        type: 'object',
        required: ['data', 'has_more'],
        properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Widget' } }, has_more: { type: 'boolean' } },
      },
    },
  },
};

// The operations to enrich, in a stable order. Each carries the REST definitions
// attachSdkTypes replaces + a curl request codeblock attachSdkExamples rewrites.
const OPERATIONS: { method: string; path: string }[] = [
  { method: 'post', path: '/widgets' },
  { method: 'get', path: '/widgets' },
  { method: 'get', path: '/widgets/{widgetId}' },
  { method: 'get', path: '/widgets/paged' },
];

/** A minimal REST Reference: a curl request codeblock (what attachSdkExamples
 * rewrites) + REST param/return definitions (what attachSdkTypes replaces) + an
 * OpenAPI context (method+path) so the bridge can match the operation. */
function makeRef(method: string, path: string): Reference {
  return {
    title: `${method.toUpperCase()} ${path}`,
    canonical: `${method}-${path}`.replace(/[/{}]/g, '-'),
    description: '',
    category: 'rest' as Reference['category'],
    definitions: [
      {
        title: 'Query parameters',
        properties: [{ name: 'limit', type: 'integer', description: '' }],
        type: '$rest.param.query',
      } as Definition,
      { title: 'Response', properties: [], type: 'return' } as Definition,
    ],
    examples: {
      groups: [
        {
          examples: [
            {
              codeblock: {
                tabs: [
                  { title: 'cURL', language: 'shell', code: `curl -X ${method.toUpperCase()} https://api.example.com${path}` },
                ],
              },
            },
          ],
        },
      ],
    },
    context: { method, path } as unknown as Reference['context'],
  } as Reference;
}

/** Build the References and run BOTH enrichers in place (the real pipeline order). */
function enrich(): Reference[] {
  const refs = OPERATIONS.map((o) => makeRef(o.method, o.path));
  attachSdkExamples(refs, rawDoc);
  attachSdkTypes(refs, rawDoc);
  return refs;
}

// ---- Generator (opt-in) --------------------------------------------------
describe.runIf(BUILD)('generate the uniform.json golden', () => {
  it('build __fixtures__/1.sdk-uniform/uniform.json (enriched SDK uniform)', () => {
    const golden = buildGolden(enrich());
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(GOLDEN, `${JSON.stringify(golden, null, 2)}\n`);
    // Sanity: every op enriched with 6 SDK tabs + a full per-language signature set.
    expect(golden).toHaveLength(OPERATIONS.length);
    for (const op of golden) {
      expect(op.sdkTabs).toHaveLength(SDK_LANGS.length);
      expect(Object.keys(op.sdk?.signatures ?? {})).toEqual(SDK_LANGS.map((l) => l.language));
    }
  });
});

// ---- Regen guard (offline) ----------------------------------------------
describe.skipIf(!fs.existsSync(GOLDEN) || BUILD)('opensdk-uniform enriched uniform (regen guard)', () => {
  it('re-running the enrichment JSON-equals the committed uniform.json golden', () => {
    const golden = buildGolden(enrich());
    const expected = JSON.parse(fs.readFileSync(GOLDEN, 'utf8'));
    expect(golden).toEqual(expected);
  });
});
