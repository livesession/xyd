import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { diffSurfaces, opensdkToSurface } from '../src/surface';
import type { SdkSurface } from '../src/surface';

const IR = JSON.parse(readFileSync(join(__dirname, '../__fixtures__/1.basic/output.json'), 'utf8'));

describe('opensdkToSurface', () => {
  const surface = opensdkToSurface(IR);

  it('reduces the resource tree to method paths (resource + action verb)', () => {
    const paths = surface.methods.map((m) => m.path.join(' ')).sort();
    expect(paths).toEqual(['pets create', 'pets list', 'pets retrieve']);
  });

  it('classifies params by kind (path/query/body) with wire names', () => {
    const byPath = new Map(surface.methods.map((m) => [m.path.join(' '), m]));

    const list = byPath.get('pets list')!;
    expect(list.params.map((p) => `${p.name}:${p.kind}`).sort()).toEqual(['after:query', 'limit:query']);
    expect(list.responseType).toBe('page'); // pagination detected -> page, not object

    const create = byPath.get('pets create')!;
    expect(create.params.map((p) => `${p.name}:${p.kind}`).sort()).toEqual(['name:body', 'status:body']);
    expect(create.params.find((p) => p.name === 'name')!.required).toBe(true);
    expect(create.responseType).toBe('object');

    const retrieve = byPath.get('pets retrieve')!;
    expect(retrieve.params.map((p) => `${p.name}:${p.kind}`)).toEqual(['pet_id:path']);
  });
});

describe('diffSurfaces', () => {
  const ours = opensdkToSurface(IR);

  it('reports full coverage when diffed against itself', () => {
    const diff = diffSurfaces(ours, ours);
    expect(diff.l0Coverage).toBe(1);
    expect(diff.l1Coverage).toBe(1);
    expect(diff.methodsOnlyOracle).toEqual([]);
    expect(diff.methodsOnlyOurs).toEqual([]);
  });

  it('counts a missing method as an L0 gap and honors skipMethods', () => {
    const oracle: SdkSurface = {
      methods: [...ours.methods, { path: ['pets', 'delete'], params: [{ name: 'pet_id', kind: 'path', required: true, typeName: 'string' }], responseType: '' }],
    };
    const diff = diffSurfaces(ours, oracle);
    expect(diff.oracleMethodCount).toBe(4);
    expect(diff.methodsOnlyOracle).toEqual(['pets delete']);
    expect(diff.l0Coverage).toBeCloseTo(3 / 4);

    const skipped = diffSurfaces(ours, oracle, { skipMethods: ['pets delete'] });
    expect(skipped.l0Coverage).toBe(1);
  });

  it('flags param divergences and honors oracleOnlyParams', () => {
    const oracle: SdkSurface = JSON.parse(JSON.stringify(ours));
    const list = oracle.methods.find((m) => m.path.join(' ') === 'pets list')!;
    list.params.push({ name: 'limit', kind: 'query', required: false, typeName: 'integer' }); // dup guard
    list.params.push({ name: 'order', kind: 'query', required: false, typeName: 'string' });

    const diff = diffSurfaces(ours, oracle);
    const listDiff = diff.perMethod.find((d) => d.path.join(' ') === 'pets list');
    expect(listDiff?.paramsOnlyOracle).toContain('order:query');

    const allowed = diffSurfaces(ours, oracle, { oracleOnlyParams: ['order'] });
    expect(allowed.perMethod.find((d) => d.path.join(' ') === 'pets list')).toBeUndefined();
    expect(allowed.l1Coverage).toBe(1);
  });
});
