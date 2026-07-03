import { describe, expect, it } from 'vitest';

import { findType, walkMethods } from '../src';
import type { OpensdkSpecJson } from '../src';

const spec: OpensdkSpecJson = {
  opensdk: '1.0.0',
  info: { title: 'Demo', version: '1.0.0' },
  types: [
    { name: 'Pet', kind: 'struct', fields: [{ name: 'id', type: { kind: 'scalar', scalar: 'string' }, required: true }] },
    { name: 'Status', kind: 'enum', base: 'string', values: [{ value: 'a' }, { value: 'b' }] },
  ],
  resources: [
    {
      name: 'pets',
      methods: [{ action: 'list', httpMethod: 'get', path: '/pets' }],
      resources: [
        {
          name: 'tags',
          methods: [{ action: 'create', httpMethod: 'post', path: '/pets/{pet_id}/tags' }],
        },
      ],
    },
  ],
};

describe('opensdk-core spec helpers', () => {
  it('findType resolves named types by name', () => {
    expect(findType(spec, 'Status')?.kind).toBe('enum');
    expect(findType(spec, 'Pet')?.fields?.[0].name).toBe('id');
    expect(findType(spec, 'Missing')).toBeUndefined();
  });

  it('walkMethods flattens the resource tree (with the resource path)', () => {
    const flat = walkMethods(spec);
    const keys = flat.map((m) => `${m.path.join('/')} ${m.method.action}`).sort();
    expect(keys).toEqual(['pets list', 'pets/tags create']);
  });
});
