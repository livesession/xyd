import { describe, expect, it } from 'vitest';

import { diffIR } from '../src';
import type { IrChange, OpensdkSpecJson } from '../src';

const base = (): OpensdkSpecJson => ({
  opensdk: '1.0.0',
  info: { title: 'Demo', version: '1.0.0' },
  security: [{ kind: 'bearer' }],
  types: [
    {
      name: 'Pet',
      kind: 'struct',
      fields: [
        { name: 'id', type: { kind: 'scalar', scalar: 'string' }, required: true },
        { name: 'name', type: { kind: 'scalar', scalar: 'string' } },
      ],
    },
    { name: 'Status', kind: 'enum', base: 'string', values: [{ value: 'available' }, { value: 'sold' }] },
    {
      name: 'Result',
      kind: 'union',
      semantics: 'oneOf',
      variants: [{ kind: 'ref', name: 'Pet' }, { kind: 'scalar', scalar: 'string' }],
    },
  ],
  resources: [
    {
      name: 'pets',
      methods: [
        {
          action: 'list',
          httpMethod: 'get',
          path: '/pets',
          queryParams: [{ name: 'limit', type: { kind: 'scalar', scalar: 'integer' } }],
          primaryResponse: { kind: 'ref', name: 'Pet' },
          pagination: { style: 'cursor', itemsField: 'data' },
        },
        { action: 'create', httpMethod: 'post', path: '/pets' },
      ],
    },
  ],
});

/** Mutate a deep clone of the base IR. */
const mutate = (fn: (s: OpensdkSpecJson) => void): OpensdkSpecJson => {
  const s = JSON.parse(JSON.stringify(base())) as OpensdkSpecJson;
  fn(s);
  return s;
};

const only = (changes: IrChange[], kind: string) => changes.filter((c) => c.kind === kind);

describe('diffIR', () => {
  it('identical specs produce no changes', () => {
    expect(diffIR(base(), base()).changes).toEqual([]);
  });

  it('removed method is breaking, added method is safe', () => {
    const removed = diffIR(base(), mutate((s) => { s.resources![0].methods = s.resources![0].methods!.slice(0, 1); }));
    expect(only(removed.changes, 'method-removed')).toMatchObject([{ severity: 'breaking', path: 'pets.create' }]);

    const added = diffIR(base(), mutate((s) => {
      s.resources![0].methods!.push({ action: 'delete', httpMethod: 'delete', path: '/pets/{id}' });
    }));
    expect(only(added.changes, 'method-added')).toMatchObject([{ severity: 'safe', path: 'pets.delete' }]);
  });

  it('param changes classify by impact', () => {
    const d = diffIR(base(), mutate((s) => {
      const m = s.resources![0].methods![0];
      m.queryParams = [
        // type change + required flip on limit
        { name: 'limit', type: { kind: 'scalar', scalar: 'string' }, required: true },
        // new required param = breaking; new optional = safe
        { name: 'after', type: { kind: 'scalar', scalar: 'string' }, required: true },
        { name: 'order', type: { kind: 'scalar', scalar: 'string' } },
      ];
    }));
    expect(only(d.changes, 'param-type-changed')).toMatchObject([{ severity: 'breaking', path: 'pets.list.queryParams.limit' }]);
    expect(only(d.changes, 'param-required-flip')).toMatchObject([{ severity: 'breaking' }]);
    expect(only(d.changes, 'param-added')).toMatchObject([
      { severity: 'breaking', path: 'pets.list.queryParams.after' },
      { severity: 'safe', path: 'pets.list.queryParams.order' },
    ]);
  });

  it('wireName change with a stable identifier is risky', () => {
    const d = diffIR(base(), mutate((s) => {
      s.resources![0].methods![0].queryParams![0].wireName = 'limit[]';
    }));
    expect(only(d.changes, 'param-wire-name-changed')).toMatchObject([{ severity: 'risky', detail: 'limit -> limit[]' }]);
  });

  it('struct field removal/type/required flips are breaking; optional addition safe; nullable flip risky', () => {
    const d = diffIR(base(), mutate((s) => {
      const pet = s.types!.find((t) => t.name === 'Pet')!;
      pet.fields = [
        { name: 'id', type: { kind: 'scalar', scalar: 'integer' }, required: false }, // type change + required flip
        { name: 'name', type: { kind: 'scalar', scalar: 'string' }, nullable: true }, // nullable flip
        { name: 'tag', type: { kind: 'scalar', scalar: 'string' } }, // safe add
      ];
    }));
    expect(only(d.changes, 'field-type-changed')).toMatchObject([{ severity: 'breaking', path: 'types.Pet.fields.id' }]);
    expect(only(d.changes, 'field-required-flip')).toMatchObject([{ severity: 'breaking' }]);
    expect(only(d.changes, 'field-nullable-flip')).toMatchObject([{ severity: 'risky', path: 'types.Pet.fields.name' }]);
    expect(only(d.changes, 'field-added')).toMatchObject([{ severity: 'safe', path: 'types.Pet.fields.tag' }]);
  });

  it('enum value removal is breaking, addition risky; union variant removal breaking, addition safe', () => {
    const d = diffIR(base(), mutate((s) => {
      s.types!.find((t) => t.name === 'Status')!.values = [{ value: 'available' }, { value: 'pending' }];
      s.types!.find((t) => t.name === 'Result')!.variants = [{ kind: 'ref', name: 'Pet' }, { kind: 'ref', name: 'Status' }];
    }));
    expect(only(d.changes, 'enum-value-removed')).toMatchObject([{ severity: 'breaking' }]);
    expect(only(d.changes, 'enum-value-added')).toMatchObject([{ severity: 'risky' }]);
    expect(only(d.changes, 'union-variant-removed')).toMatchObject([{ severity: 'breaking' }]);
    expect(only(d.changes, 'union-variant-added')).toMatchObject([{ severity: 'safe' }]);
  });

  it('binding, response-type, pagination and security changes are breaking', () => {
    const d = diffIR(base(), mutate((s) => {
      const m = s.resources![0].methods![0];
      m.path = '/v2/pets';
      m.primaryResponse = { kind: 'ref', name: 'Result' };
      m.pagination = undefined;
      s.security = [{ kind: 'apiKey-header', name: 'X-Key' }];
    }));
    expect(only(d.changes, 'binding-changed')).toMatchObject([{ severity: 'breaking', path: 'pets.list' }]);
    expect(only(d.changes, 'response-type-changed')).toMatchObject([{ severity: 'breaking' }]);
    expect(only(d.changes, 'pagination-removed')).toMatchObject([{ severity: 'breaking' }]);
    expect(only(d.changes, 'security-changed')).toMatchObject([{ severity: 'breaking', path: 'security' }]);
  });

  it('sdk behavior changes are safe (runtime policy, not API surface)', () => {
    const d = diffIR(base(), mutate((s) => { s.sdk = { retry: { maxRetries: 5 } }; }));
    expect(d.changes).toMatchObject([{ severity: 'safe', kind: 'sdk-behavior-changed', path: 'sdk' }]);
  });
});
