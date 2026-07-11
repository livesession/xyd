import { openapi2opensdk } from '@xyd-js/openapi2opensdk';
import { type NamedType, walkMethods } from '@xyd-js/opensdk-core';
import type { EmitterContext } from '@xyd-js/opensdk-framework';
import type { OpenAPIV3 } from 'openapi-types';
import { describe, expect, it } from 'vitest';
import { SDK_LANGS } from '../src/index';

// MEDIUM tier: exercise generateUsage across many operation SHAPES × all 6
// languages. A single OpenAPI doc covers all-optional, required-body, enum,
// array, nested-object, path-param, and a oneOf union — converted to the IR at
// test time (the same converter->emitter path the real pipeline uses).
const doc: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: { title: 'Shapes API', version: '1.0.0' },
  paths: {
    '/items': {
      // all-optional query params
      get: {
        operationId: 'listItems',
        parameters: [
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', example: 5 } },
          { name: 'q', in: 'query', required: false, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'ok',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Item' } } } },
          },
        },
      },
      // required body: scalar + enum + array + nested object
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
      // path param
      get: {
        operationId: 'getItem',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'ok', content: { 'application/json': { schema: { $ref: '#/components/schemas/Item' } } } },
        },
      },
    },
    '/items/{id}/transform': {
      // path param + body with a oneOf union field
      post: {
        operationId: 'transformItem',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/TransformRequest' } } },
        },
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
          count: { type: 'integer' },
          active: { type: 'boolean' },
          status: { type: 'string', enum: ['draft', 'published', 'archived'] },
          tags: { type: 'array', items: { type: 'string' } },
          meta: { $ref: '#/components/schemas/Meta' },
        },
      },
      Meta: { type: 'object', properties: { key: { type: 'string' }, value: { type: 'string' } } },
      TransformRequest: {
        type: 'object',
        required: ['payload'],
        properties: { payload: { oneOf: [{ $ref: '#/components/schemas/TextPayload' }, { $ref: '#/components/schemas/NumberPayload' }] } },
      },
      TextPayload: { type: 'object', required: ['text'], properties: { text: { type: 'string' } } },
      NumberPayload: { type: 'object', required: ['value'], properties: { value: { type: 'number' } } },
      Item: { type: 'object', required: ['id', 'name'], properties: { id: { type: 'string' }, name: { type: 'string' } } },
    },
  },
};

const ir = openapi2opensdk(doc);
const types = new Map<string, NamedType>((ir.types ?? []).map((t) => [t.name, t]));
const ctx: EmitterContext = { spec: ir, types, emitterOptions: {} };
const methods = walkMethods(ir);

// A lang-specific token that proves the client was constructed.
const CLIENT_MARK: Record<string, string> = {
  go: 'NewClient(',
  python: 'Client(',
  typescript: 'new ',
  ruby: 'Client.new',
  java: 'Client.builder(',
  csharp: 'Client(',
};

describe('opensdk-uniform: generateUsage across shapes × languages', () => {
  it('produces a well-formed snippet for every (operation × language)', () => {
    expect(methods.length).toBeGreaterThanOrEqual(4);
    for (const fm of methods) {
      for (const lang of SDK_LANGS) {
        const code = lang.emitter.generateUsage?.(fm.method, fm.path, ctx) ?? '';
        const where = `${lang.language}:${fm.method.action}`;
        expect(code.trim().length, where).toBeGreaterThan(0);
        expect(code, where).toContain(CLIENT_MARK[lang.language]);
        // no unrendered values leaked into the snippet
        expect(code, where).not.toContain('[object Object]');
        expect(code, where).not.toContain('undefined');
        expect(code, where).not.toContain('NaN');
      }
    }
  });

  it('fills the all-optional list method (limit from the spec example)', () => {
    const list = methods.find((m) => m.method.action === 'list');
    expect(list).toBeDefined();
    const py = list?.method && SDK_LANGS[1].emitter.generateUsage?.(list.method, list.path, ctx);
    expect(py).toContain('limit=5'); // realistic (spec example), not empty/generic
  });

  it('fills the required body with an enum first-value + nested object + array (create)', () => {
    const create = methods.find((m) => m.method.action === 'create');
    expect(create).toBeDefined();
    for (const lang of SDK_LANGS) {
      const code = create?.method ? (lang.emitter.generateUsage?.(create.method, create.path, ctx) ?? '') : '';
      // the enum's FIRST value ("draft") is a real token, never a placeholder —
      // each language renders it differently (Go const ItemCreateStatusDraft,
      // TS "draft", Java DRAFT), so match case-insensitively.
      expect(code.toLowerCase(), `${lang.language}:create`).toContain('draft');
    }
  });

  it('passes the path argument for a path-param method (get/{id}, transform)', () => {
    const get = methods.find((m) => m.method.action === 'retrieve' || m.method.action === 'get');
    expect(get).toBeDefined();
    for (const lang of SDK_LANGS) {
      const code = get?.method ? (lang.emitter.generateUsage?.(get.method, get.path, ctx) ?? '') : '';
      // the id path arg is rendered as a non-empty string literal ("id" from the hint)
      expect(code, `${lang.language}:get`).toContain('"id"');
    }
  });
});
