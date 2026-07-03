import { describe, expect, it } from 'vitest';

import { applyOverlay, mergeOpenApiDocs } from '../index';

const doc = (title: string, paths: Record<string, unknown>, schemas: Record<string, unknown> = {}) => ({
  openapi: '3.0.3',
  info: { title, version: '1.0.0' },
  paths,
  components: { schemas },
});

describe('mergeOpenApiDocs', () => {
  it('unions disjoint paths + components; keeps info from the first', () => {
    const a = doc('A', { '/a': { get: { responses: { '200': { description: 'ok' } } } } }, { Shared: { type: 'string' } });
    const b = doc('B', { '/b': { get: { responses: { '200': { description: 'ok' } } } } }, { Shared: { type: 'string' }, BOnly: { type: 'number' } });
    const merged = mergeOpenApiDocs([a, b]);
    expect((merged.info as { title: string }).title).toBe('A');
    expect(Object.keys(merged.paths as object).sort()).toEqual(['/a', '/b']);
    expect(Object.keys((merged.components as { schemas: object }).schemas).sort()).toEqual(['BOnly', 'Shared']);
  });

  it('throws on a conflicting path', () => {
    const a = doc('A', { '/a': { get: { summary: 'x' } } });
    const b = doc('B', { '/a': { get: { summary: 'y' } } });
    expect(() => mergeOpenApiDocs([a, b])).toThrow(/conflict.*\/a/i);
  });

  it('merges disjoint methods of the same path at operation granularity (and does not mutate inputs)', () => {
    const a = doc('A', { '/pets': { get: { operationId: 'list' } } });
    const b = doc('B', { '/pets': { post: { operationId: 'create' } } });
    const merged = mergeOpenApiDocs([a, b]);
    expect(Object.keys((merged.paths as any)['/pets']).sort()).toEqual(['get', 'post']);
    expect(Object.keys((a.paths as any)['/pets'])).toEqual(['get']); // input A untouched
  });

  it('conflicts only when the SAME method differs, naming the actual pair of inputs', () => {
    const a = doc('A', { '/pets': { get: { operationId: 'list' } } });
    const b = doc('B', { '/pets': { get: { operationId: 'listPets' } } });
    expect(() => mergeOpenApiDocs([a, b])).toThrow(/method "GET".*inputs\[0\].*inputs\[1\]/);
    // 3 inputs: /y first contributed by inputs[1], conflict is inputs[1] vs inputs[2] (not inputs[0])
    const base = doc('base', { '/x': { get: {} } });
    const b1 = doc('b1', { '/y': { get: { operationId: 'a' } } });
    const b2 = doc('b2', { '/y': { get: { operationId: 'b' } } });
    expect(() => mergeOpenApiDocs([base, b1, b2])).toThrow(/inputs\[1\].*inputs\[2\]/);
  });

  it('throws on a conflicting component but dedups identical ones', () => {
    const a = doc('A', {}, { Pet: { type: 'object', properties: { id: { type: 'string' } } } });
    const same = doc('B', {}, { Pet: { type: 'object', properties: { id: { type: 'string' } } } });
    expect(() => mergeOpenApiDocs([a, same])).not.toThrow();
    const diff = doc('C', {}, { Pet: { type: 'number' } });
    expect(() => mergeOpenApiDocs([a, diff])).toThrow(/conflict.*Pet/i);
  });
});

describe('applyOverlay', () => {
  it('deep-merges an update action into the matched node', () => {
    const d = doc('X', { '/pets': { get: { summary: 'old', operationId: 'listPets' } } });
    applyOverlay(d, {
      overlay: '1.0.0',
      info: { title: 'o', version: '1' },
      actions: [{ target: "$.paths['/pets'].get", update: { summary: 'new', tags: ['pets'] } }],
    });
    const get = (d.paths as any)['/pets'].get;
    expect(get.summary).toBe('new'); // updated
    expect(get.operationId).toBe('listPets'); // preserved
    expect(get.tags).toEqual(['pets']); // added
  });

  it('removes a matched node', () => {
    const d = doc('X', { '/pets': { get: { summary: 's', operationId: 'listPets' } } });
    applyOverlay(d, { overlay: '1.0.0', info: { title: 'o', version: '1' }, actions: [{ target: "$.paths['/pets'].get.operationId", remove: true }] });
    expect((d.paths as any)['/pets'].get.operationId).toBeUndefined();
    expect((d.paths as any)['/pets'].get.summary).toBe('s');
  });

  it('rejects an unsupported overlay version', () => {
    expect(() => applyOverlay(doc('X', {}), { overlay: '2.0.0', actions: [] })).toThrow(/overlay version/i);
  });
});
