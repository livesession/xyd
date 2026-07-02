import { describe, expect, it } from 'vitest';

import type { Method, NamedType, Pagination } from '@xyd-js/opensdk-core';

import { planOperation } from '../src';

/** A minimal method with overrides. */
function method(over: Partial<Method> = {}): Method {
  return { action: 'list', httpMethod: 'get', path: '/pets', ...over };
}

/** The symbol table every test plans against. */
const types = new Map<string, NamedType>(
  (
    [
      { name: 'Pet', kind: 'struct', fields: [{ name: 'id', type: { kind: 'scalar', scalar: 'string' } }] },
      {
        name: 'Shape',
        kind: 'union',
        semantics: 'oneOf',
        variants: [{ kind: 'ref', name: 'Pet' }],
        discriminator: { propertyName: 'type', mapping: { pet: 'Pet' } },
      },
      {
        name: 'OpenShape',
        kind: 'union',
        semantics: 'anyOf',
        variants: [{ kind: 'ref', name: 'Pet' }],
      },
      {
        name: 'EmptyMappedShape',
        kind: 'union',
        semantics: 'oneOf',
        variants: [{ kind: 'ref', name: 'Pet' }],
        discriminator: { propertyName: 'type', mapping: {} },
      },
      {
        name: 'NoPropertyShape',
        kind: 'union',
        semantics: 'oneOf',
        variants: [{ kind: 'ref', name: 'Pet' }],
        discriminator: { propertyName: '', mapping: { pet: 'Pet' } },
      },
      { name: 'Color', kind: 'enum', base: 'string', values: [{ value: 'red' }] },
      { name: 'PetAlias', kind: 'alias', of: { kind: 'ref', name: 'Pet' } },
    ] as NamedType[]
  ).map((t) => [t.name, t]),
);

const plan = (over: Partial<Method> = {}) => planOperation(method(over), types);

describe('planOperation: pageName', () => {
  const pagination = (over: Partial<Pagination> = {}): Pagination => ({
    style: 'cursor',
    itemsField: 'data',
    itemType: { kind: 'ref', name: 'Pet' },
    cursorParam: 'after',
    ...over,
  });

  it('cursor + data + itemType -> CursorPage', () => {
    expect(plan({ pagination: pagination() }).pageName).toBe('CursorPage');
  });

  it('page style -> Page', () => {
    expect(plan({ pagination: pagination({ style: 'page' }) }).pageName).toBe('Page');
  });

  it('offset style needs offsetParam', () => {
    expect(plan({ pagination: pagination({ style: 'offset', offsetParam: 'skip' }) }).pageName).toBe('OffsetPage');
    expect(plan({ pagination: pagination({ style: 'offset', offsetParam: undefined }) }).pageName).toBeNull();
  });

  it('unknown style -> null', () => {
    expect(plan({ pagination: pagination({ style: 'link' }) }).pageName).toBeNull();
  });

  it('itemsField !== "data" keeps the raw envelope', () => {
    expect(plan({ pagination: pagination({ itemsField: 'items' }) }).pageName).toBeNull();
  });

  it('missing itemType keeps the raw envelope', () => {
    expect(plan({ pagination: pagination({ itemType: undefined }) }).pageName).toBeNull();
  });

  it('a binary primary response gates paging off', () => {
    const p = plan({
      pagination: pagination(),
      responses: [{ status: '200', contentType: 'application/octet-stream' }],
    });
    expect(p.pageName).toBeNull();
    expect(p.binaryContentType).toBe('application/octet-stream');
  });

  it('no pagination -> null', () => {
    expect(plan().pageName).toBeNull();
  });
});

describe('planOperation: binaryContentType', () => {
  it('non-json 2xx -> its content type', () => {
    expect(plan({ responses: [{ status: '200', contentType: 'audio/mpeg' }] }).binaryContentType).toBe('audio/mpeg');
  });

  it('json 2xx -> null', () => {
    expect(plan({ responses: [{ status: '200', contentType: 'application/json' }] }).binaryContentType).toBeNull();
  });

  it('only the FIRST declared 2xx is inspected (go-faithful)', () => {
    const p = plan({
      responses: [
        { status: '200', contentType: 'application/json' },
        { status: '201', contentType: 'application/octet-stream' },
      ],
    });
    expect(p.binaryContentType).toBeNull();
  });

  it('non-2xx and "default" responses are ignored', () => {
    const p = plan({
      responses: [
        { status: 'default', contentType: 'application/octet-stream' },
        { status: '400', contentType: 'application/problem+xml' },
      ],
    });
    expect(p.binaryContentType).toBeNull();
  });

  it('a 2xx without a content type -> null', () => {
    expect(plan({ responses: [{ status: '204' }] }).binaryContentType).toBeNull();
  });

  it('no responses -> null', () => {
    expect(plan().binaryContentType).toBeNull();
  });
});

describe('planOperation: encoding + body', () => {
  it('no body -> null encoding, hasBody false', () => {
    const p = plan();
    expect(p.encoding).toBeNull();
    expect(p.hasBody).toBe(false);
    expect(p.bodyRequired).toBe(false);
  });

  it('json body (explicit, absent or unknown encoding) -> json', () => {
    const type = { kind: 'ref', name: 'Pet' };
    expect(plan({ requestBody: { type, encoding: 'json' } }).encoding).toBe('json');
    expect(plan({ requestBody: { type } }).encoding).toBe('json');
    expect(plan({ requestBody: { type, encoding: 'weird' } }).encoding).toBe('json');
  });

  it('multipart and form pass through', () => {
    const type = { kind: 'ref', name: 'Pet' };
    expect(plan({ requestBody: { type, encoding: 'multipart' } }).encoding).toBe('multipart');
    expect(plan({ requestBody: { type, encoding: 'form' } }).encoding).toBe('form');
  });

  it('bodyRequired follows requestBody.required', () => {
    const type = { kind: 'ref', name: 'Pet' };
    expect(plan({ requestBody: { type, required: true } }).bodyRequired).toBe(true);
    expect(plan({ requestBody: { type } }).bodyRequired).toBe(false);
  });
});

describe('planOperation: paramGroups + passthrough', () => {
  it('groups path/query/header params (defaulting to [])', () => {
    const pathParam = { name: 'pet_id', type: { kind: 'scalar', scalar: 'string' } };
    const queryParam = { name: 'limit', type: { kind: 'scalar', scalar: 'integer' } };
    const headerParam = { name: 'x_tag', type: { kind: 'scalar', scalar: 'string' } };
    const p = plan({ pathParams: [pathParam], queryParams: [queryParam], headerParams: [headerParam] });
    expect(p.paramGroups).toEqual({ path: [pathParam], query: [queryParam], header: [headerParam] });
    expect(plan().paramGroups).toEqual({ path: [], query: [], header: [] });
  });

  it('passes injectIdempotencyKey through (defaulting false)', () => {
    expect(plan({ injectIdempotencyKey: true }).injectIdempotencyKey).toBe(true);
    expect(plan().injectIdempotencyKey).toBe(false);
  });

  it('carries the planned method', () => {
    const m = method({ action: 'create', httpMethod: 'post' });
    expect(planOperation(m, types).method).toBe(m);
  });
});

describe('planOperation: primaryResponse classification', () => {
  it('no primary response -> none', () => {
    expect(plan().primaryResponse).toBe('none');
  });

  it('struct ref -> struct; unknown placeholder ref defaults to struct', () => {
    expect(plan({ primaryResponse: { kind: 'ref', name: 'Pet' } }).primaryResponse).toBe('struct');
    expect(plan({ primaryResponse: { kind: 'ref', name: 'Ghost' } }).primaryResponse).toBe('struct');
  });

  it('union with a mapped discriminator -> union-mapped', () => {
    expect(plan({ primaryResponse: { kind: 'ref', name: 'Shape' } }).primaryResponse).toBe('union-mapped');
  });

  it('union without a usable mapping -> union-open', () => {
    expect(plan({ primaryResponse: { kind: 'ref', name: 'OpenShape' } }).primaryResponse).toBe('union-open');
    expect(plan({ primaryResponse: { kind: 'ref', name: 'EmptyMappedShape' } }).primaryResponse).toBe('union-open');
    expect(plan({ primaryResponse: { kind: 'ref', name: 'NoPropertyShape' } }).primaryResponse).toBe('union-open');
  });

  it('enum and alias refs decode as plain values -> scalar', () => {
    expect(plan({ primaryResponse: { kind: 'ref', name: 'Color' } }).primaryResponse).toBe('scalar');
    expect(plan({ primaryResponse: { kind: 'ref', name: 'PetAlias' } }).primaryResponse).toBe('scalar');
  });

  it('non-ref shapes -> scalar', () => {
    expect(plan({ primaryResponse: { kind: 'scalar', scalar: 'string' } }).primaryResponse).toBe('scalar');
    expect(
      plan({ primaryResponse: { kind: 'array', items: { kind: 'ref', name: 'Pet' } } }).primaryResponse,
    ).toBe('scalar');
    expect(plan({ primaryResponse: { kind: 'any' } }).primaryResponse).toBe('scalar');
  });
});
