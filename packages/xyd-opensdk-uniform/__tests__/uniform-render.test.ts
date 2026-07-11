import type { OpensdkSpecJson } from '@xyd-js/opensdk-core';
import type { Reference } from '@xyd-js/uniform';
import type { OpenAPIV3 } from 'openapi-types';
import { describe, expect, it } from 'vitest';
import { SDK_LANGS, SDK_TAB_LANGUAGES, attachSdkExamples, extractSdkTabs, resolveCompileLang } from '../src/index';

// A small RAW ($ref-carrying) OpenAPI doc: a GET with an OPTIONAL query param that
// has a spec `example` (20), and a POST whose body has a required scalar, an enum,
// and an array — enough to exercise property-filling + realistic values end to end.
const rawDoc: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: { title: 'Pet Store', version: '1.0.0' },
  paths: {
    '/pets': {
      get: {
        operationId: 'listPets',
        parameters: [{ name: 'limit', in: 'query', required: false, schema: { type: 'integer', example: 20 } }],
        responses: {
          '200': {
            description: 'ok',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Pet' } } } },
          },
        },
      },
      post: {
        operationId: 'createPet',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/PetCreate' } } },
        },
        responses: {
          '201': {
            description: 'created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Pet' } } },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      PetCreate: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          status: { type: 'string', enum: ['available', 'pending', 'sold'] },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
      Pet: {
        type: 'object',
        required: ['id', 'name'],
        properties: { id: { type: 'string' }, name: { type: 'string' } },
      },
    },
  },
};

/** A minimal Reference with a request codeblock carrying a curl tab + an OpenAPI
 * context (method+path) — the shape `attachSdkExamples` matches + rewrites. */
function makeRef(method: string, path: string): Reference {
  return {
    title: `${method} ${path}`,
    canonical: `${method}-${path}`,
    description: '',
    definitions: [],
    examples: {
      groups: [
        {
          examples: [
            {
              codeblock: {
                tabs: [{ title: 'cURL', language: 'shell', code: `curl -X ${method.toUpperCase()} https://api.example.com${path}` }],
              },
            },
          ],
        },
      ],
    },
    context: { method, path } as unknown as Reference['context'],
  } as Reference;
}

function enriched(): Reference[] {
  const refs = [makeRef('post', '/pets'), makeRef('get', '/pets')];
  attachSdkExamples(refs, rawDoc);
  return refs;
}

describe('opensdk-uniform: attachSdkExamples', () => {
  it('rewrites the request codeblock to ONE switcher — 6 SDK tabs + curl, SDK first', () => {
    const [createRef] = enriched();
    const tabs = createRef.examples.groups[0].examples[0].codeblock.tabs;
    expect(tabs).toHaveLength(SDK_LANGS.length + 1); // 6 SDK + curl
    expect(tabs.slice(0, SDK_LANGS.length).map((t) => t.language)).toEqual(SDK_LANGS.map((l) => l.language));
    expect(tabs[tabs.length - 1].language).toBe('shell'); // curl last
    for (const t of tabs.slice(0, SDK_LANGS.length)) expect(t.code.length).toBeGreaterThan(0);
  });

  it('fills body properties with realistic values (enum first-value) through the full pipeline', () => {
    const [createRef] = enriched();
    const byLang = new Map(createRef.examples.groups[0].examples[0].codeblock.tabs.map((t) => [t.language, t.code]));
    // create has a required `name` + an enum `status` + an array `tags` — all filled.
    expect(byLang.get('python')).toContain('name=');
    expect(byLang.get('python')).toContain('available'); // enum first value, not a placeholder
    expect(byLang.get('typescript')).toContain('name:');
  });

  it("honors a param's spec `example` (limit=20, not a generic 1) via realisticLiteral", () => {
    const [, listRef] = enriched();
    const byLang = new Map(listRef.examples.groups[0].examples[0].codeblock.tabs.map((t) => [t.language, t.code]));
    expect(byLang.get('python')).toContain('limit=20');
    expect(byLang.get('typescript')).toContain('limit: 20');
  });

  it('leaves an x-codeSamples ref (no curl tab) untouched', () => {
    const ref = makeRef('post', '/pets');
    ref.examples.groups[0].examples[0].codeblock.tabs = [{ title: 'Custom', language: 'go', code: 'custom' }];
    attachSdkExamples([ref], rawDoc);
    expect(ref.examples.groups[0].examples[0].codeblock.tabs).toEqual([{ title: 'Custom', language: 'go', code: 'custom' }]);
  });

  it('never throws on a non-OpenAPI doc — leaves samples untouched', () => {
    const ref = makeRef('post', '/pets');
    expect(() => attachSdkExamples([ref], {} as OpenAPIV3.Document)).not.toThrow();
    expect(ref.examples.groups[0].examples[0].codeblock.tabs).toHaveLength(1); // still just curl
  });
});

// The "check against Uniform JSON" verification: pull every SDK code tab out of
// the enriched Uniform and confirm it's a valid, per-language-routable code block
// — i.e. the result renders "in a programming-language manner". A gated tier
// (O2S_<LANG>_SMOKE) can additionally COMPILE each extracted tab (Phase: advanced).
describe('opensdk-uniform: Uniform JSON is renderable per language', () => {
  it('extracts one code tab per SDK language per operation, all routable to a compiler', () => {
    const tabs = extractSdkTabs(enriched());
    // 2 operations × 6 languages.
    expect(tabs).toHaveLength(2 * SDK_LANGS.length);
    for (const tab of tabs) {
      expect(SDK_TAB_LANGUAGES.has(tab.language)).toBe(true);
      expect(tab.code.trim().length).toBeGreaterThan(0);
      expect(resolveCompileLang(tab.language)).toBeDefined(); // typescript→node, csharp→dotnet, ...
    }
    // every language is represented.
    expect(new Set(tabs.map((t) => t.language))).toEqual(new Set(SDK_LANGS.map((l) => l.language)));
  });
});

// Guard: the IR the bridge builds is well-formed (the enrichment silently no-ops
// on a bad IR, so a smoke of openapi2opensdk here keeps that failure visible).
describe('opensdk-uniform: IR sanity', () => {
  it('the raw doc converts to an IR with both operations', async () => {
    const { openapi2opensdk } = await import('@xyd-js/openapi2opensdk');
    const { walkMethods } = await import('@xyd-js/opensdk-core');
    const ir: OpensdkSpecJson = openapi2opensdk(rawDoc);
    const keys = walkMethods(ir).map((m) => `${m.method.httpMethod.toLowerCase()} ${m.method.path}`);
    expect(keys).toContain('post /pets');
    expect(keys).toContain('get /pets');
  });
});
