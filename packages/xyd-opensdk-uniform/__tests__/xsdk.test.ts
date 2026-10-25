import type { Definition, Reference } from '@xyd-js/uniform';
import type { OpenAPIV3 } from 'openapi-types';
import { describe, expect, it } from 'vitest';
import {
  attachSdk,
  attachSdkFromSpec,
  embedXSdk,
  getXSdk,
  loadSpecSource,
  orderSdkLanguageIds,
  prepareSdk,
  type XSdkOperation,
} from '../src/index';

// x-sdk: the spec-carried SDK docs extension. A CI/CD pipeline embeds the
// per-language artifacts once (embedXSdk / `opensdk xsdk`); the docs engine
// then only READS them (attachSdkFromSpec) — and the two modes MUST produce
// byte-identical uniform output.

const doc: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: { title: 'XSdk API', version: '1.0.0' },
  paths: {
    '/widgets': {
      get: {
        operationId: 'listWidgets',
        parameters: [{ name: 'limit', in: 'query', required: false, schema: { type: 'integer' } }],
        responses: {
          '200': {
            description: 'ok',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Widget' } } } },
          },
        },
      },
      post: {
        operationId: 'createWidget',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/WidgetCreate' } } },
        },
        responses: {
          '201': {
            description: 'created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Widget' } } },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      WidgetCreate: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } },
      Widget: { type: 'object', required: ['id'], properties: { id: { type: 'string' }, name: { type: 'string' } } },
    },
  },
};

function makeRef(method: string, path: string): Reference {
  return {
    title: `${method} ${path}`,
    canonical: `${method}-widgets`,
    description: '',
    definitions: [
      { title: 'Query parameters', properties: [{ name: 'limit', type: 'integer', description: '' }], type: '$rest.param.query' } as Definition,
      { title: 'Response', properties: [], type: 'return' } as Definition,
    ],
    examples: {
      groups: [{
        description: 'Request',
        examples: [{ codeblock: { title: '', tabs: [{ title: 'curl', language: 'shell', code: `curl -X ${method} https://x${path}` }] } }],
      }],
    },
    context: { method, path } as unknown as Reference['context'],
  } as Reference;
}

const opXSdk = (d: OpenAPIV3.Document, method: 'get' | 'post') =>
  (d.paths!['/widgets']![method] as unknown as Record<string, XSdkOperation>)['x-sdk'];

describe('embedXSdk', () => {
  it('embeds root languages + per-operation signature/usage/types into a CLONE', () => {
    const before = JSON.stringify(doc);
    const { doc: enriched, operations, languages } = embedXSdk(doc);

    expect(JSON.stringify(doc)).toBe(before); // input untouched
    expect(operations).toBe(2);
    expect(languages).toEqual(['go', 'python', 'typescript', 'ruby', 'java', 'csharp']);
    expect(getXSdk(enriched)).toEqual({ languages });

    const g = opXSdk(enriched, 'get');
    for (const lang of languages) {
      expect(g[lang].signature).toBeTruthy();
      expect(g[lang].usage).toBeTruthy();
      expect(g[lang].types!.request).toBeDefined();
      expect(g[lang].types!.response).toBeDefined();
    }
    expect(g.python.usage).toContain('client.widgets.list');
  });

  it('honors a langs restriction; throws on unsupported doc / unknown-only langs', () => {
    const { doc: enriched, languages } = embedXSdk(doc, { langs: ['go', 'python'] });
    expect(languages).toEqual(['go', 'python']);
    expect(Object.keys(opXSdk(enriched, 'get'))).toEqual(['go', 'python']);

    expect(() => embedXSdk({} as OpenAPIV3.Document)).toThrow(/unsupported/);
    expect(() => embedXSdk(doc, { langs: ['cobol'] })).toThrow(/no known SDK languages/);
  });
});

describe('attachSdkFromSpec', () => {
  it('embed → read produces IDENTICAL uniform output to the generate path', () => {
    const generated = [makeRef('get', '/widgets'), makeRef('post', '/widgets')];
    attachSdk(generated, prepareSdk(doc)!, { keepRest: true });

    const fromSpec = [makeRef('get', '/widgets'), makeRef('post', '/widgets')];
    const attached = attachSdkFromSpec(fromSpec, embedXSdk(doc).doc, { keepRest: true });

    expect(attached).toBe(true);
    expect(JSON.parse(JSON.stringify(fromSpec))).toEqual(JSON.parse(JSON.stringify(generated)));
  });

  it('returns false and leaves references untouched without a root x-sdk', () => {
    const ref = makeRef('get', '/widgets');
    const before = JSON.parse(JSON.stringify(ref));
    expect(attachSdkFromSpec([ref], doc)).toBe(false);
    expect(JSON.parse(JSON.stringify(ref))).toEqual(before);
  });

  it('opts.langs narrows the spec languages (docs config narrowing)', () => {
    const ref = makeRef('get', '/widgets');
    attachSdkFromSpec([ref], embedXSdk(doc).doc, { keepRest: true, langs: ['python', 'cobol'] });

    const tabs = ref.examples!.groups[0].examples[0].codeblock.tabs.map((t) => t.language);
    expect(tabs).toEqual(['shell', 'python']); // curl first — the raw-HTTP default view
    const returns = ref.definitions!.find((d) => d.title === 'Returns')!;
    expect(returns.variants!.map((v) => v.meta![0].value)).toEqual(['python']);
  });

  it('renders a hand-authored unknown language id with the id as title', () => {
    const custom = JSON.parse(JSON.stringify(doc)) as OpenAPIV3.Document;
    (custom as any)['x-sdk'] = { languages: ['rust'] };
    (custom.paths!['/widgets']!.get as any)['x-sdk'] = {
      rust: {
        signature: 'client.widgets().list()',
        usage: 'let widgets = client.widgets().list().await?;',
        types: {
          request: { fields: [{ name: 'limit', langType: 'i64' }] },
          response: { typeName: 'Vec<Widget>', fields: [] },
        },
      },
    } satisfies XSdkOperation;

    const ref = makeRef('get', '/widgets');
    attachSdkFromSpec([ref], custom, { keepRest: true });

    const tabs = ref.examples!.groups[0].examples[0].codeblock.tabs;
    expect(tabs.map((t) => t.language)).toEqual(['shell', 'rust']);
    expect(tabs[1].title).toBe('rust'); // unknown id → id as display title
    expect(tabs[1].meta).toBe('rust');
    expect((ref.context as any).sdk.signatures.rust).toBe('client.widgets().list()');
  });

  it('getXSdk validates the root shape', () => {
    expect(getXSdk(doc)).toBeNull();
    expect(getXSdk({ 'x-sdk': { languages: 'go' } } as any)).toBeNull();
    expect(getXSdk({ 'x-sdk': { languages: [] } } as any)).toBeNull();
    expect(getXSdk({ 'x-sdk': { languages: ['go'] } } as any)).toEqual({ languages: ['go'] });
  });
});

describe('loadSpecSource', () => {
  it('reads a yaml spec raw (no dereferencing) and nulls on a missing file', async () => {
    const path = await import('node:path');
    const fixture = path.resolve(__dirname, '../../../__tests__/__fixtures__/openapi/basic.yaml');
    const loaded = await loadSpecSource(fixture);
    expect(loaded?.openapi).toBeTruthy();
    expect(Object.keys(loaded!.paths ?? {}).length).toBeGreaterThan(0);

    expect(await loadSpecSource('/definitely/missing.yaml')).toBeNull();
  });
});

// The switcher ORDER. The raw-HTTP (curl) entry is always first; the SDK
// languages follow the configured order — a `langs` request when given (the
// docs config's `sdk.languages`), else a spec's own root `x-sdk.languages`
// (the order `embedXSdk` / `opensdk xsdk` was asked for), else SDK_LANGS.
describe('the switcher order', () => {
  const tabLangs = (ref: Reference) => ref.examples!.groups[0].examples[0].codeblock.tabs.map((t) => t.language);
  const returnVariants = (ref: Reference) =>
    ref.definitions!.find((d) => d.title === 'Returns')!.variants!.map((v) => v.meta![0].value);

  it('orderSdkLanguageIds: the request narrows + orders; unknown ids drop; repeats collapse; no request → as available', () => {
    const available = ['go', 'python', 'typescript'];
    expect(orderSdkLanguageIds(available)).toEqual(['go', 'python', 'typescript']);
    expect(orderSdkLanguageIds(available, null)).toEqual(['go', 'python', 'typescript']);
    expect(orderSdkLanguageIds(available, ['typescript', 'go'])).toEqual(['typescript', 'go']);
    expect(orderSdkLanguageIds(available, ['ruby', 'typescript', 'cobol', 'python', 'typescript'])).toEqual(['typescript', 'python']);
    expect(orderSdkLanguageIds(available, ['cobol'])).toEqual([]);
  });

  it('embedXSdk writes the REQUESTED order to the root list and to every operation', () => {
    const { doc: embedded, languages } = embedXSdk(doc, { langs: ['python', 'typescript', 'go', 'python'] });
    expect(languages).toEqual(['python', 'typescript', 'go']);
    expect(getXSdk(embedded)).toEqual({ languages: ['python', 'typescript', 'go'] });
    expect(Object.keys(opXSdk(embedded, 'post'))).toEqual(['python', 'typescript', 'go']);
  });

  it("attachSdkFromSpec keeps the spec's order without a request — curl first", () => {
    const embedded = embedXSdk(doc, { langs: ['python', 'typescript', 'go'] }).doc;
    const ref = makeRef('post', '/widgets');
    attachSdkFromSpec([ref], embedded, { keepRest: true });
    expect(tabLangs(ref)).toEqual(['shell', 'python', 'typescript', 'go']);
    expect(returnVariants(ref)).toEqual(['python', 'typescript', 'go']);
  });

  it('attachSdkFromSpec follows a requested order (the docs config) over the spec order — curl still first', () => {
    const embedded = embedXSdk(doc, { langs: ['python', 'typescript', 'go'] }).doc;
    const ref = makeRef('post', '/widgets');
    attachSdkFromSpec([ref], embedded, { keepRest: true, langs: ['go', 'cobol', 'python', 'go'] });
    expect(tabLangs(ref)).toEqual(['shell', 'go', 'python']);
    expect(returnVariants(ref)).toEqual(['go', 'python']);
  });

  it('attachSdk (generate mode) follows the requested order too — and matches the spec path byte for byte', () => {
    const generated = makeRef('post', '/widgets');
    attachSdk([generated], prepareSdk(doc)!, { keepRest: true, langs: ['typescript', 'go', 'python'] });
    expect(tabLangs(generated)).toEqual(['shell', 'typescript', 'go', 'python']);

    const fromSpec = makeRef('post', '/widgets');
    attachSdkFromSpec([fromSpec], embedXSdk(doc, { langs: ['typescript', 'go', 'python'] }).doc, { keepRest: true });
    expect(JSON.parse(JSON.stringify(fromSpec))).toEqual(JSON.parse(JSON.stringify(generated)));
  });
});

// The nested table travels with the x-sdk: `types.nested` behind the two
// one-level groups, left out when nothing is referenced — the shape
// `opensdk xsdk` writes. An x-sdk written before it existed (no `nested`, no
// `schemaRef`) still renders: one level deep, linked only to the pages the
// reference's own evidence knows, never a guessed `objects/<Type>`.
describe('x-sdk nested types', () => {
  it('embedXSdk carries the nested table behind request/response', () => {
    const { doc: enriched } = embedXSdk(doc, { langs: ['go', 'typescript'] });
    const post = opXSdk(enriched, 'post');
    expect(post.go.types!.nested?.WidgetCreate?.schemaRef).toBe('#/components/schemas/WidgetCreate');
    expect(post.go.types!.nested?.Widget?.fields?.map((f) => f.name)).toEqual(['ID', 'Name']);
    expect(post.typescript.types!.nested?.Widget?.fields?.map((f) => f.name)).toEqual(['id', 'name']);
    expect(post.go.types!.response.schemaRef).toBe('#/components/schemas/Widget');
  });

  it('a hand-authored x-sdk without schemaRef links only to what the REST rows know', () => {
    const custom = JSON.parse(JSON.stringify(doc)) as OpenAPIV3.Document;
    (custom as any)['x-sdk'] = { languages: ['go'] };
    (custom.paths!['/widgets']!.get as any)['x-sdk'] = {
      go: {
        signature: 'client.Widgets.List(ctx) ([]Widget, error)',
        types: {
          request: { fields: [] },
          response: { typeName: '[]Widget', langType: '[]Widget', refTypeName: 'Widget' },
        },
      },
    } satisfies XSdkOperation;

    // no evidence: the type text alone — never a guessed `objects/Widget`
    const bare = makeRef('get', '/widgets');
    attachSdkFromSpec([bare], custom, { keepRest: true });
    const returns = (ref: Reference) => ref.definitions!.find((d) => d.title === 'Returns')!.variants![0].properties!;
    expect(returns(bare)[0].type).toBe('[]Widget');
    expect(returns(bare)[0].symbolDef).toBeUndefined();
    expect(returns(bare)[0].properties).toBeUndefined();

    // the REST response row links the schema: the SDK row follows it
    const evidenced = makeRef('get', '/widgets');
    evidenced.definitions![1].properties = [
      { name: '', type: 'object', description: '', symbolDef: { id: '#/components/schemas/Widget', canonical: 'objects/Widget', label: 'widget' } },
    ];
    attachSdkFromSpec([evidenced], custom, { keepRest: true });
    expect(returns(evidenced)[0].symbolDef).toEqual({ id: '#/components/schemas/Widget', canonical: 'objects/Widget' });
  });
});
