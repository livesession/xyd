import { compileUsageSnippet } from '@xyd-js/opensdk-ci';
import type { OpenAPIV3 } from 'openapi-types';
import { describe, expect, it } from 'vitest';
import { SDK_LANGS, prepareSdk } from '../src/index';

// ADVANCED tier: does the generated USAGE snippet actually COMPILE / transpile per
// language? Generate the whole SDK, drop the snippet in as a buildable entry, and
// run the toolchain. GATED per language (O2S_<LANG>_SMOKE=1) so the default offline
// `test:unit` stays green without go/tsc/python/ruby/javac/dotnet — these run in the
// tests-opensdk-pipeline CI job (all six toolchains installed).

// A rich create body: required scalar + enum + array + nested object — the shape
// most likely to surface a bad literal in any language.
const doc: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: { title: 'Compile Shapes', version: '1.0.0' },
  paths: {
    '/items': {
      post: {
        operationId: 'createItem',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ItemCreate' } } },
        },
        responses: {
          '201': { description: 'c', content: { 'application/json': { schema: { $ref: '#/components/schemas/Item' } } } },
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
          count: { type: 'integer' },
          active: { type: 'boolean' },
          status: { type: 'string', enum: ['draft', 'published'] },
          tags: { type: 'array', items: { type: 'string' } },
          meta: { $ref: '#/components/schemas/Meta' },
        },
      },
      Meta: { type: 'object', properties: { key: { type: 'string' } } },
      Item: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
    },
  },
};

const preparedOrNull = prepareSdk(doc);
if (!preparedOrNull) throw new Error('prepareSdk returned null — is @xyd-js/native built?');
const prepared = preparedOrNull;
const ir = prepared.ir;
const create = [...prepared.byKey.values()].find((m) => m.method.action === 'create');

// tab-language → the env gate that enables its compile (matches the emitter smokes).
const GATE: Record<string, string> = {
  go: 'O2S_GO_SMOKE',
  python: 'O2S_PY_SMOKE',
  typescript: 'O2S_NODE_SMOKE',
  ruby: 'O2S_RUBY_SMOKE',
  java: 'O2S_JAVA_SMOKE',
  csharp: 'O2S_DOTNET_SMOKE',
};

describe('opensdk-uniform: usage snippets compile per language (gated)', () => {
  for (const lang of SDK_LANGS) {
    const gated = process.env[GATE[lang.language]] === '1';
    it.runIf(gated)(`compiles the ${lang.language} usage snippet`, () => {
      if (!create) throw new Error('create method missing from IR');
      // Throws on a compile error; returns false only if the toolchain is absent
      // (which shouldn't happen when the gate is intentionally set).
      //
      // The harness uses the emitter ONLY to produce the snippet, so hand it the native
      // one: this compiles exactly what ships, and needs no TypeScript emitter package.
      // When @xyd-js/opensdk-ci is itself retired this test goes with it — the compile
      // harness is what's being removed, not the coverage.
      const key = `${String(create.method.httpMethod ?? '').toLowerCase()} ${String(create.method.path ?? '')}`;
      const nativeUsage = prepared.docsByLang.get(lang.compileLang)?.[key]?.usage;
      const adapter = { language: lang.compileLang, generateUsage: () => nativeUsage } as never;
      const compiled = compileUsageSnippet(
        lang.compileLang,
        ir as never,
        create.method as never,
        create.path,
        adapter,
      );
      expect(compiled).toBe(true);
    });
  }
});
