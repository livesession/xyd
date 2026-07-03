import { describe, expect, it } from 'vitest';

import type { Method, NamedType } from '@xyd-js/opensdk-core';

import { planExample, planMethodExample } from '../src/example-plan';

const types = new Map<string, NamedType>([
  [
    'Pet',
    {
      name: 'Pet',
      kind: 'struct',
      fields: [
        { name: 'id', type: { kind: 'scalar', scalar: 'string' }, required: true },
        { name: 'age', type: { kind: 'scalar', scalar: 'integer' } },
        { name: 'status', type: { kind: 'ref', name: 'Status' }, required: true },
      ],
    },
  ],
  ['Status', { name: 'Status', kind: 'enum', base: 'string', values: [{ value: 'available' }, { value: 'sold' }] }],
  [
    'Node',
    {
      name: 'Node',
      kind: 'struct',
      fields: [
        { name: 'name', type: { kind: 'scalar', scalar: 'string' }, required: true },
        { name: 'child', type: { kind: 'ref', name: 'Node' }, required: true },
      ],
    },
  ],
]);

describe('planExample', () => {
  it('renders scalar leaves with sensible defaults', () => {
    expect(planExample({ kind: 'scalar', scalar: 'string' }, types)).toEqual({ kind: 'string', value: 'x' });
    expect(planExample({ kind: 'scalar', scalar: 'integer' }, types)).toEqual({ kind: 'integer', value: 0 });
    expect(planExample({ kind: 'scalar', scalar: 'boolean' }, types)).toEqual({ kind: 'boolean', value: true });
    expect(planExample({ kind: 'scalar', scalar: 'string', format: 'binary' }, types)).toEqual({ kind: 'binary' });
  });

  it('honors a const scalar', () => {
    expect(planExample({ kind: 'scalar', scalar: 'string', const: 'chat.completion' }, types)).toEqual({
      kind: 'const',
      value: 'chat.completion',
    });
  });

  it('resolves an enum ref to its first value', () => {
    expect(planExample({ kind: 'ref', name: 'Status' }, types)).toEqual({
      kind: 'enum',
      typeName: 'Status',
      value: 'available',
    });
  });

  it('expands a struct ref: required-only by default, all fields with withOptional', () => {
    const req = planExample({ kind: 'ref', name: 'Pet' }, types);
    expect(req).toMatchObject({ kind: 'object', typeName: 'Pet' });
    if (req.kind === 'object') expect(req.fields.map((f) => f.name)).toEqual(['id', 'status']);

    const all = planExample({ kind: 'ref', name: 'Pet' }, types, { withOptional: true });
    if (all.kind === 'object') expect(all.fields.map((f) => f.name).sort()).toEqual(['age', 'id', 'status']);
  });

  it('terminates on a recursive struct instead of looping forever', () => {
    const v = planExample({ kind: 'ref', name: 'Node' }, types, { withOptional: true });
    expect(v.kind).toBe('object');
    // the self-referential `child` bottoms out at a terminal empty object
    if (v.kind === 'object') {
      const child = v.fields.find((f) => f.name === 'child');
      expect(child?.value).toEqual({ kind: 'object', typeName: 'Node', fields: [] });
    }
  });

  it('arrays and maps wrap a single element example', () => {
    expect(planExample({ kind: 'array', items: { kind: 'scalar', scalar: 'string' } }, types)).toEqual({
      kind: 'array',
      item: { kind: 'string', value: 'x' },
    });
    expect(planExample({ kind: 'map', values: { kind: 'scalar', scalar: 'integer' } }, types)).toEqual({
      kind: 'map',
      value: { kind: 'integer', value: 0 },
    });
  });
});

describe('planMethodExample', () => {
  const method: Method = {
    action: 'list',
    httpMethod: 'get',
    path: '/pets/{pet_id}/toys',
    pathParams: [{ name: 'pet_id', type: { kind: 'scalar', scalar: 'string' }, required: true }],
    queryParams: [
      { name: 'after', type: { kind: 'scalar', scalar: 'string' } },
      { name: 'limit', type: { kind: 'scalar', scalar: 'integer' }, required: true },
    ],
    requestBody: {
      contentType: 'application/json',
      type: { kind: 'ref', name: 'Pet' },
      required: true,
      encoding: 'json',
    },
  };

  it('path args use the param name as a readable non-empty string', () => {
    const ex = planMethodExample(method, types);
    expect(ex.pathArgs).toHaveLength(1);
    expect(ex.pathArgs[0].value).toEqual({ kind: 'string', value: 'pet_id' });
  });

  it('required-only case omits optional query but keeps required query + required body fields', () => {
    const ex = planMethodExample(method, types);
    const names = ex.fields.map((f) => f.name);
    expect(names).toContain('limit'); // required query
    expect(names).not.toContain('after'); // optional query dropped
    expect(names).toContain('id'); // required body field
    expect(names).not.toContain('age'); // optional body field dropped
    expect(ex.hasOptional).toBe(true);
  });

  it('with-all-params case includes optionals', () => {
    const ex = planMethodExample(method, types, { withOptional: true });
    const names = ex.fields.map((f) => f.name);
    expect(names).toEqual(expect.arrayContaining(['after', 'limit', 'id', 'age', 'status']));
  });
});
