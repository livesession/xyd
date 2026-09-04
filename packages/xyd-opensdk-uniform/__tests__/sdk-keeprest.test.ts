import type { Definition, Reference } from '@xyd-js/uniform';
import type { OpenAPIV3 } from 'openapi-types';
import { describe, expect, it } from 'vitest';
import { attachSdk, attachSdkExamples, attachSdkTypes, prepareSdk, prepareSdkFromSource } from '../src/index';

// keep-REST mode: the docs-framework integration keeps the raw-HTTP view as a
// first-class flavor — REST definitions stay on the reference, tagged with
// definition-level meta { sdkFlavor: "http" }, AFTER the prepended SDK
// Parameters/Returns. Default mode (no keepRest) must stay byte-compatible
// with the legacy replace behavior (apitoolchain-web).

const doc: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: { title: 'KeepRest API', version: '1.0.0' },
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
    },
  },
  components: {
    schemas: {
      Widget: { type: 'object', required: ['id'], properties: { id: { type: 'string' }, name: { type: 'string' } } },
    },
  },
};

function makeRef(): Reference {
  return {
    title: 'get /widgets',
    canonical: 'get-widgets',
    description: '',
    category: 'rest' as Reference['category'],
    definitions: [
      { title: 'Query parameters', properties: [{ name: 'limit', type: 'integer', description: '' }], type: '$rest.param.query' } as Definition,
      { title: 'Scopes', properties: [], type: 'scopes' } as Definition,
      { title: 'Response', properties: [], type: 'return' } as Definition,
    ],
    examples: {
      groups: [{
        description: 'Request',
        examples: [{ codeblock: { title: '', tabs: [{ title: 'curl', language: 'shell', code: 'curl https://x/widgets' }] } }],
      }],
    },
    context: { method: 'get', path: '/widgets' } as unknown as Reference['context'],
  } as Reference;
}

const isHttpFlagged = (d: Definition) => !!(d as any).meta?.some((m: any) => m.name === 'sdkFlavor' && m.value === 'http');
const isSdkDef = (d: Definition) => !!d.variants?.some(v => v.meta?.some(m => m.name === 'sdkLang'));
const isRest = (d: Definition) => d.type === 'return' || (typeof d.type === 'string' && d.type.startsWith('$rest.'));

describe('attachSdkTypes keepRest', () => {
  it('keeps REST definitions, flags them, prepends SDK defs, preserves order', () => {
    const ref = makeRef();
    attachSdkTypes([ref], doc, { keepRest: true });

    const defs = ref.definitions!;
    // SDK defs first
    expect(isSdkDef(defs[0])).toBe(true);
    expect(defs.filter(isSdkDef).map(d => d.title)).toEqual(['Parameters', 'Returns']);
    // REST defs kept in original order, flagged
    const rest = defs.filter(isRest).filter(d => !isSdkDef(d));
    expect(rest.map(d => d.title)).toEqual(['Query parameters', 'Response']);
    expect(rest.every(isHttpFlagged)).toBe(true);
    // non-REST defs kept, NOT flagged
    const scopes = defs.find(d => d.title === 'Scopes')!;
    expect(isHttpFlagged(scopes)).toBe(false);
  });

  it('is idempotent — a second run never stacks SDK defs or duplicates flags', () => {
    const ref = makeRef();
    attachSdkTypes([ref], doc, { keepRest: true });
    const once = JSON.parse(JSON.stringify(ref.definitions));
    attachSdkTypes([ref], doc, { keepRest: true });
    expect(ref.definitions).toEqual(once);
    const q = ref.definitions!.find(d => d.title === 'Query parameters') as any;
    expect(q.meta.filter((m: any) => m.name === 'sdkFlavor')).toHaveLength(1);
  });

  it('default path (no keepRest) still REPLACES REST definitions — legacy guard', () => {
    const ref = makeRef();
    attachSdkTypes([ref], doc);
    const defs = ref.definitions!;
    expect(defs.some(d => d.title === 'Query parameters')).toBe(false);
    expect(defs.some(d => d.title === 'Scopes')).toBe(true); // non-REST kept
    expect(defs.filter(isSdkDef).map(d => d.title)).toEqual(['Parameters', 'Returns']);
    expect(defs.some(isHttpFlagged)).toBe(false);
  });
});

describe('prepareSdk / attachSdk', () => {
  it('attachSdk on one prepared IR ≡ attachSdkExamples + attachSdkTypes', () => {
    const a = makeRef();
    const b = makeRef();

    attachSdkExamples([a], doc);
    attachSdkTypes([a], doc, { keepRest: true });

    const prepared = prepareSdk(doc)!;
    expect(prepared).not.toBeNull();
    attachSdk([b], prepared, { keepRest: true });

    expect(JSON.parse(JSON.stringify(b))).toEqual(JSON.parse(JSON.stringify(a)));
  });

  it('attachSdk toggles examples/types passes independently', () => {
    const prepared = prepareSdk(doc)!;

    const onlyTypes = makeRef();
    attachSdk([onlyTypes], prepared, { examples: false, keepRest: true });
    expect(onlyTypes.examples!.groups[0].examples[0].codeblock.tabs.map(t => t.language)).toEqual(['shell']);
    expect(onlyTypes.definitions!.some(isSdkDef)).toBe(true);

    const onlyExamples = makeRef();
    attachSdk([onlyExamples], prepared, { types: false });
    expect(onlyExamples.examples!.groups[0].examples[0].codeblock.tabs.length).toBeGreaterThan(1);
    expect(onlyExamples.definitions!.some(isSdkDef)).toBe(false);
  });

  it('langs restriction limits variants + tabs; unsupported doc → null', () => {
    const prepared = prepareSdk(doc)!;
    const ref = makeRef();
    attachSdk([ref], prepared, { langs: ['python'], keepRest: true });

    const returns = ref.definitions!.find(d => d.title === 'Returns')!;
    expect(returns.variants!.map(v => v.meta![0].value)).toEqual(['python']);
    const tabs = ref.examples!.groups[0].examples[0].codeblock.tabs.map(t => t.language);
    expect(tabs).toEqual(['shell', 'python']); // curl first — the raw-HTTP default view

    expect(prepareSdk({} as OpenAPIV3.Document)).toBeNull();
  });

  it('prepareSdkFromSource loads a spec file without dereferencing', async () => {
    const path = await import('node:path');
    const fixture = path.resolve(__dirname, '../../../__tests__/__fixtures__/openapi/basic.yaml');
    const prepared = await prepareSdkFromSource(fixture);
    expect(prepared).not.toBeNull();
    expect(prepared!.byKey.size).toBeGreaterThan(0);

    expect(await prepareSdkFromSource('/definitely/missing.yaml')).toBeNull();
  });
});
