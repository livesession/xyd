import { walkMethods } from '@xyd-js/opensdk-core';
import type { EmitterContext } from '@xyd-js/opensdk-framework';
import { openapi2opensdk } from '@xyd-js/openapi2opensdk';
import type { Definition, OpenAPIReferenceContext, Reference } from '@xyd-js/uniform';
import type { OpenAPIV3 } from 'openapi-types';
import { describe, expect, it } from 'vitest';
import { SDK_LANGS, attachSdkTypes } from '../src/index';

// A doc covering the shapes that matter for a type reference: a required scalar +
// enum + array + nested object body (create), an all-optional query list, and a
// path param (get).
const doc: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: { title: 'Types API', version: '1.0.0' },
  paths: {
    '/items': {
      get: {
        operationId: 'listItems',
        parameters: [{ name: 'limit', in: 'query', required: false, schema: { type: 'integer' } }],
        responses: {
          '200': {
            description: 'ok',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Item' } } } },
          },
        },
      },
      post: {
        operationId: 'createItem',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ItemCreate' } } },
        },
        responses: {
          '201': { description: 'created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Item' } } } },
        },
      },
    },
    '/items/{id}': {
      get: {
        operationId: 'getItem',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'ok', content: { 'application/json': { schema: { $ref: '#/components/schemas/Item' } } } },
        },
      },
    },
  },
  components: {
    schemas: {
      ItemCreate: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'published'] },
          meta: { $ref: '#/components/schemas/Meta' },
        },
      },
      Meta: { type: 'object', properties: { key: { type: 'string' } } },
      Item: { type: 'object', required: ['id', 'name'], properties: { id: { type: 'string' }, name: { type: 'string' } } },
    },
  },
};

/** A minimal REST Reference (with the REST definitions attachSdkTypes replaces). */
function makeRef(method: string, path: string): Reference {
  return {
    title: `${method} ${path}`,
    canonical: `${method}-${path}`,
    description: '',
    category: 'rest' as Reference['category'],
    definitions: [
      { title: 'Query parameters', properties: [{ name: 'limit', type: 'integer', description: '' }], type: '$rest.param.query' } as Definition,
      { title: 'Response', properties: [], type: 'return' } as Definition,
    ],
    examples: { groups: [] },
    context: { method, path } as unknown as Reference['context'],
  } as Reference;
}

function enriched(): Reference[] {
  const refs = [makeRef('post', '/items'), makeRef('get', '/items'), makeRef('get', '/items/{id}')];
  attachSdkTypes(refs, doc);
  return refs;
}

const paramsDef = (ref: Reference) => ref.definitions[0];
const langVariant = (def: Definition, lang: string) => def.variants?.find((v) => v.meta?.[0]?.value === lang);
/** The field rows of a variant — nested under its `<argName> Type` root
 * (Go/Node/Java) or flat (Python/Ruby/.NET). */
const rows = (def: Definition, lang: string) => {
  const v = langVariant(def, lang);
  return v?.rootProperty?.properties ?? v?.properties ?? [];
};

describe('opensdk-uniform: attachSdkTypes', () => {
  it('replaces REST definitions with [Parameters, Returns], no $rest.* left', () => {
    const [create] = enriched();
    expect(create.definitions).toHaveLength(2);
    expect(create.definitions.some((d) => typeof d.type === 'string' && d.type.startsWith('$rest.'))).toBe(false);
    // Returns keeps the REST "return" type tag.
    expect(create.definitions[1].type).toBe('return');
  });

  it('carries one sdkLang variant per language on each definition', () => {
    const [create] = enriched();
    for (const def of create.definitions) {
      expect(def.variants?.map((v) => v.meta?.[0]?.value)).toEqual(SDK_LANGS.map((l) => l.language));
      expect(def.variants?.every((v) => v.meta?.[0]?.name === 'sdkLang')).toBe(true);
    }
  });

  it('titles the def "Parameters" and roots the Go variant at `body ItemNewParams`', () => {
    const [create] = enriched();
    // OpenAI-style: the section is "Parameters"; the Go variant nests its fields
    // under a `<argName> <ParamsType>` root (create is a POST → body).
    expect(paramsDef(create).title).toBe('Parameters');
    const go = langVariant(paramsDef(create), 'go');
    expect(go?.rootProperty?.name).toBe('body');
    expect(go?.rootProperty?.type).toBe('ItemNewParams');
  });

  it('renders each language field in its own casing + type (create body)', () => {
    const [create] = enriched();
    const goRows = rows(paramsDef(create), 'go');
    const pyRows = rows(paramsDef(create), 'python');
    // Go: PascalCase names, enum ref kept, nested Meta linked.
    const goName = goRows.find((p) => p.name === 'Name');
    expect(goName?.type).toBe('string');
    expect(goName?.meta?.some((m) => m.name === 'required')).toBe(true);
    expect(goRows.find((p) => p.name === 'Meta')?.symbolDef?.canonical).toBe('objects/Meta');
    // Python: snake_case names, Optional for the optional status.
    expect(pyRows.find((p) => p.name === 'name')).toBeDefined();
    expect(pyRows.find((p) => p.name === 'status')?.type).toContain('Optional');
  });

  it('attaches a per-language method signature on context.sdk', () => {
    const [create] = enriched();
    const sig = (create.context as OpenAPIReferenceContext).sdk?.signatures;
    expect(Object.keys(sig ?? {})).toEqual(SDK_LANGS.map((l) => l.language));
    expect(sig?.go).toContain('client.Items.New(');
    expect(sig?.go).toContain('(*Item, error)');
    expect(sig?.typescript).toContain('Promise<');
    expect(sig?.csharp).toContain('Task<');
  });

  it('shows the Returns type fields (Item struct)', () => {
    const [create] = enriched();
    expect(rows(create.definitions[1], 'go').map((p) => p.name).sort()).toEqual(['ID', 'Name']);
  });

  it('leaves references without a matched operation untouched', () => {
    const ref = makeRef('post', '/nonexistent');
    attachSdkTypes([ref], doc);
    expect(ref.definitions.some((d) => d.type === '$rest.param.query')).toBe(true); // REST intact
  });

  it('never throws on a non-OpenAPI doc', () => {
    const ref = makeRef('post', '/items');
    expect(() => attachSdkTypes([ref], {} as OpenAPIV3.Document)).not.toThrow();
  });
});

// Sanity: the IR the bridge builds actually has the operations.
describe('opensdk-uniform: sdk-types IR sanity', () => {
  it('converts the doc to an IR with all three operations', () => {
    const ir = openapi2opensdk(doc);
    const keys = walkMethods(ir).map((m) => `${m.method.httpMethod.toLowerCase()} ${m.method.path}`);
    expect(keys).toContain('post /items');
    expect(keys).toContain('get /items');
    expect(keys).toContain('get /items/{id}');
  });
});
