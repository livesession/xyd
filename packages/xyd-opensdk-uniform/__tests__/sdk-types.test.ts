import type { Definition, OpenAPIReferenceContext, Reference } from '@xyd-js/uniform';
import type { OpenAPIV3 } from 'openapi-types';
import { describe, expect, it } from 'vitest';
import { SDK_LANGS, attachSdkTypes, prepareSdk } from '../src/index';

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

// Sanity: the IR the bridge builds actually has the operations. Goes through
// the package's own public seam — `prepareSdk` builds the IR natively and keys
// every method as "<httpMethod> <path>", which is the same guarantee the old
// walkMethods(openapi2opensdk(doc)) assertion made against the (now deleted)
// TypeScript converter.
describe('opensdk-uniform: sdk-types IR sanity', () => {
  it('converts the doc to an IR with all three operations', () => {
    const prepared = prepareSdk(doc);
    expect(prepared).not.toBeNull();
    const keys = [...prepared!.byKey.keys()];
    expect(keys).toContain('post /items');
    expect(keys).toContain('get /items');
    expect(keys).toContain('get /items/{id}');
  });
});

// Nested rows + page-resolved links. A row typed by another type expands into
// that type's rows (through arrays), a type with a component schema links to the
// schema's PAGE — resolved from the references list or the operation's own REST
// rows, never assumed from the name — and a synthesized inline type (no schema,
// no page) renders as plain type text with its rows beneath.
const nestedDoc: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: { title: 'Nested API', version: '1.0.0' },
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
    '/items/search': {
      post: {
        operationId: 'searchItems',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { q: { type: 'string' } } } } },
        },
        responses: {
          '200': {
            description: 'ok',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ItemSearchResult' } } },
          },
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
          status: { $ref: '#/components/schemas/ItemStatus' },
          meta: { $ref: '#/components/schemas/Meta' },
        },
      },
      ItemStatus: { type: 'string', enum: ['draft', 'published'] },
      // self-referencing: the cycle guard
      Meta: { type: 'object', properties: { key: { type: 'string' }, parent: { $ref: '#/components/schemas/Meta' } } },
      Item: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          // an inline object: the converter hoists it as a synthesized type (no schema)
          stats: { type: 'object', properties: { views: { type: 'integer' } } },
        },
      },
      ItemSearchResult: {
        type: 'object',
        required: ['data', 'summary'],
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Item' } },
          summary: { type: 'object', required: ['total'], properties: { total: { type: 'integer' }, has_more: { type: 'boolean' } } },
        },
      },
    },
  },
};

type Row = { name: string; type: string; symbolDef?: { id?: string | string[]; canonical?: string | string[] }; properties?: Row[] };

/** A REST Reference whose definitions carry the given rows (the page evidence). */
function makeRestRef(method: string, path: string, restRows: Row[] = []): Reference {
  return {
    title: `${method} ${path}`,
    canonical: `${method}-${path}`,
    description: '',
    category: 'rest' as Reference['category'],
    definitions: [
      { title: 'Response', properties: restRows.map((r) => ({ description: '', ...r })), type: 'return' } as Definition,
    ],
    examples: { groups: [] },
    context: { method, path } as unknown as Reference['context'],
  } as Reference;
}

/** A component page as the references list carries it (after the x-docs pass). */
function makeComponentRef(name: string, canonical: string): Reference {
  return {
    title: name,
    canonical,
    description: '',
    definitions: [],
    examples: { groups: [] },
    type: 'rest_component_schema' as unknown as Reference['type'],
    context: { componentSchema: name } as unknown as Reference['context'],
  } as Reference;
}

const goRows = (ref: Reference, title: string) => rows(ref.definitions.find((d) => d.title === title)!, 'go');
const row = (list: Row[] | undefined, name: string) => list?.find((p) => p.name === name) as Row | undefined;

describe('opensdk-uniform: nested rows and page-resolved links', () => {
  it('expands a field typed by another type into that type\'s rows, with the cycle cut', () => {
    const ref = makeRestRef('post', '/items');
    attachSdkTypes([ref], nestedDoc);
    const meta = row(goRows(ref, 'Parameters'), 'Meta');
    expect(meta?.type).toBe('Meta');
    expect(meta?.properties?.map((p) => p.name)).toEqual(['Key', 'Parent']);
    // Meta → Parent: Meta — rendered once per chain, then stopped
    const parent = row(meta?.properties, 'Parent');
    expect(parent?.type).toBe('Meta');
    expect(parent?.properties).toBeUndefined();
  });

  it('lists an enum\'s values beneath the field, the type column keeping the language type', () => {
    const ref = makeRestRef('post', '/items');
    attachSdkTypes([ref], nestedDoc);
    const status = row(goRows(ref, 'Parameters'), 'Status');
    expect(status?.type).toBe('ItemStatus');
    expect(status?.properties?.map((p) => p.name)).toEqual(['"draft"', '"published"']);
  });

  it('renders a synthesized inline type as plain text (no link) with its rows beneath', () => {
    const ref = makeRestRef('post', '/items/search');
    attachSdkTypes([ref], nestedDoc);
    const returns = goRows(ref, 'Returns');
    const summary = row(returns, 'Summary');
    expect(summary?.type).toBe('ItemSearchResultSummary');
    expect(summary?.symbolDef).toBeUndefined();
    // rendered as the language's MODEL declares them (response side: no param.Opt)
    expect(summary?.properties?.map((p) => [p.name, p.type])).toEqual([
      ['Total', 'int64'],
      ['HasMore', 'bool'],
    ]);
    // an array of a component type: the language's type text, the schema's page, the item type's rows
    const data = row(returns, 'Data');
    expect(data?.type).toBe('[]Item');
    expect(data?.symbolDef).toEqual({ id: '#/components/schemas/Item', canonical: 'objects/Item' });
    expect(data?.properties?.map((p) => p.name)).toEqual(['ID', 'Name', 'Stats']);
    expect(row(data?.properties, 'Stats')?.symbolDef).toBeUndefined();
    expect(row(data?.properties, 'Stats')?.properties?.map((p) => p.name)).toEqual(['Views']);
  });

  it('expands a non-struct response (`[]Item`) through its item type and links it', () => {
    const ref = makeRestRef('get', '/items');
    attachSdkTypes([ref], nestedDoc);
    const [only] = goRows(ref, 'Returns');
    expect(only.type).toBe('[]Item');
    expect(only.symbolDef).toEqual({ id: '#/components/schemas/Item', canonical: 'objects/Item' });
    expect(only.properties?.map((p) => p.name)).toEqual(['ID', 'Name', 'Stats']);
  });

  it('links through the component pages the references list carries — and not past them', () => {
    const search = makeRestRef('post', '/items/search');
    const create = makeRestRef('post', '/items');
    // the list after the x-docs pass: Item's page moved by `x-docs.path`, Meta hidden (no page)
    attachSdkTypes([search, create, makeComponentRef('Item', 'catalog/item'), makeComponentRef('ItemStatus', 'objects/ItemStatus')], nestedDoc);
    expect(row(goRows(search, 'Returns'), 'Data')?.symbolDef).toEqual({ id: '#/components/schemas/Item', canonical: 'catalog/item' });
    expect(row(goRows(create, 'Parameters'), 'Meta')?.symbolDef).toEqual({ id: '#/components/schemas/Meta' });
    expect(row(goRows(create, 'Parameters'), 'Status')?.symbolDef?.canonical).toBe('objects/ItemStatus');
  });

  it('follows the operation\'s own REST rows when the list is one page long (regions mode)', () => {
    const create = makeRestRef('post', '/items', [
      { name: 'status', type: 'string', symbolDef: { id: '#/components/schemas/ItemStatus', canonical: 'types/item-status' } },
      // a hidden schema: the REST row kept its id and lost its canonical
      { name: 'meta', type: 'object', symbolDef: { id: '#/components/schemas/Meta' }, properties: [{ name: 'key', type: 'string' }] },
    ]);
    attachSdkTypes([create], nestedDoc);
    const params = goRows(create, 'Parameters');
    expect(row(params, 'Status')?.symbolDef).toEqual({ id: '#/components/schemas/ItemStatus', canonical: 'types/item-status' });
    expect(row(params, 'Meta')?.symbolDef).toEqual({ id: '#/components/schemas/Meta' });
    // a schema the REST rows do not reach keeps the converter's own page canonical
    expect(row(goRows(create, 'Returns'), 'Stats')?.symbolDef).toBeUndefined();
    expect(create.definitions.find((d) => d.title === 'Returns')?.variants?.find((v) => v.meta?.[0]?.value === 'go')?.rootProperty?.name).toBe('Item');
  });

  it('keeps the REST rows\' evidence when the SDK definitions are rebuilt (idempotent)', () => {
    const create = makeRestRef('post', '/items', [
      { name: 'meta', type: 'object', symbolDef: { id: '#/components/schemas/Meta' } },
    ]);
    attachSdkTypes([create], nestedDoc, { keepRest: true });
    attachSdkTypes([create], nestedDoc, { keepRest: true });
    expect(create.definitions.filter((d) => d.title === 'Parameters')).toHaveLength(1);
    expect(row(goRows(create, 'Parameters'), 'Meta')?.symbolDef).toEqual({ id: '#/components/schemas/Meta' });
  });
});
