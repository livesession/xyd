import { describe, expect, it } from 'vitest';

import type { Method, OpensdkSpecJson, Resource } from '@xyd-js/opensdk-core';

import { diffRequest, expectedRequest, firstMethod, mergeResources, miniDoc } from '../src';

const method = (action: string, httpMethod: string, path: string): Method => ({ action, httpMethod, path });

describe('mergeResources', () => {
  it('merges trees and dedupes methods by ACTION (not action+path)', () => {
    const target: Resource[] = [];
    mergeResources(target, [{ name: 'threads', resources: [{ name: 'runs', methods: [method('create', 'post', '/threads/runs')] }] }]);
    mergeResources(target, [{ name: 'threads', resources: [{ name: 'runs', methods: [method('create', 'post', '/threads/{id}/runs'), method('cancel', 'post', '/threads/{id}/runs/{rid}/cancel')] }] }]);
    const runs = target[0].resources?.[0];
    expect(runs?.methods?.map((m) => m.action)).toEqual(['create', 'cancel']);
    expect(runs?.methods?.[0].path).toBe('/threads/runs'); // keep-first
  });
});

describe('expectedRequest', () => {
  const spec: OpensdkSpecJson = {
    opensdk: '1.0.0',
    info: { title: 'demo', version: '1' },
    security: [{ type: 'http', kind: 'bearer' }],
    types: [
      {
        name: 'CreatePetRequest',
        kind: 'struct',
        fields: [
          { name: 'name', type: { kind: 'scalar', scalar: 'string' }, required: true },
          { name: 'tag', type: { kind: 'scalar', scalar: 'string' } },
        ],
      },
    ],
  };

  it('includes only REQUIRED body fields for a minimal call', () => {
    const m: Method = {
      ...method('create', 'post', '/pets'),
      requestBody: { type: { kind: 'ref', name: 'CreatePetRequest' } },
    };
    expect(expectedRequest(spec, m)).toEqual({
      method: 'post',
      path: '/pets',
      query: [],
      bodyFields: ['name'],
      auth: 'bearer',
      contentType: 'application/json',
    });
  });

  it('binds required query params by wireName ?? name; optionals omitted', () => {
    const m: Method = {
      ...method('list', 'get', '/pets'),
      queryParams: [
        { name: 'ids', wireName: 'ids[]', type: { kind: 'array', items: { kind: 'scalar', scalar: 'string' } }, required: true },
        { name: 'start_time', type: { kind: 'scalar', scalar: 'integer' }, required: true },
        { name: 'limit', type: { kind: 'scalar', scalar: 'integer' } },
      ],
    };
    expect(expectedRequest(spec, m).query).toEqual(['ids[]', 'start_time']);
  });
});

describe('diffRequest', () => {
  it('matches path templates and reports body/auth diffs', () => {
    const fixture = { method: 'get', path: '/pets/{pet_id}', query: [], bodyFields: ['name'], auth: 'bearer' };
    const ok = { method: 'get', path: '/pets/EXAMPLE', query: [], bodyFields: ['name', 'extra'], auth: 'bearer' };
    expect(diffRequest(ok, fixture)).toEqual([]);
    const bad = { ...ok, path: '/pets', auth: 'apikey', bodyFields: [] };
    expect(diffRequest(bad, fixture)).toEqual(['path /pets !~ /pets/{pet_id}', 'body missing name', 'auth apikey != bearer']);
  });
});

describe('spec scoping', () => {
  const raw = {
    openapi: '3.1.0',
    info: { title: 't', version: '1' },
    components: { schemas: { A: { $ref: '#/components/schemas/B' }, B: { type: 'string' }, C: { type: 'number' } } },
    paths: { '/a': { get: { responses: { '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/A' } } } } } } } },
  };

  it('miniDoc scopes to the transitive $ref closure', () => {
    const doc = miniDoc(raw, 'get', '/a');
    expect(Object.keys(doc.components.schemas).sort()).toEqual(['A', 'B']); // C dropped
    expect(Object.keys(doc.paths)).toEqual(['/a']);
  });

  it('firstMethod finds the leaf with its resource path', () => {
    const leaf = firstMethod([{ name: 'a', resources: [{ name: 'b', methods: [method('list', 'get', '/a/b')] }] }]);
    expect(leaf?.segments).toEqual(['a', 'b']);
    expect(leaf?.method.action).toBe('list');
  });
});
