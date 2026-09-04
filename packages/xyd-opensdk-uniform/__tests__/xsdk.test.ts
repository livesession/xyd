import type { Definition, Reference } from '@xyd-js/uniform';
import type { OpenAPIV3 } from 'openapi-types';
import { describe, expect, it } from 'vitest';
import {
  attachSdk,
  attachSdkFromSpec,
  embedXSdk,
  getXSdk,
  loadSpecSource,
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
