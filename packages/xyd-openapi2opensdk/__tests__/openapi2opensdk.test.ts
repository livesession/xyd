import { describe, expect, it } from 'vitest';

import { defaultSdkBehavior, mergeSdkBehavior } from '@xyd-js/opensdk-core';

import { openapi2opensdk } from '../src';
import { testFixture } from './utils';

const fixtures = [
  { name: '1.basic', description: 'named struct/enum, ref dedup, arrays, path/query/body, pagination', options: {} },
  { name: '2.allof', description: 'allOf inheritance flattened through $ref chains; nullable $ref wrapper stays a ref', options: {} },
  { name: '3.wire-name', description: 'wire/identifier split: ids[] -> ids + wireName, collision suffix, param default/example/deprecated', options: {} },
  { name: '4.discriminator', description: 'discriminator mapping: explicit ($ref + bare-name targets, unresolvable dropped) and derived from const variants', options: {} },
  { name: '5.const-literal', description: 'single-value const/enum properties stay literal scalars; standalone const component aliases; writeOnly captured', options: {} },
  { name: '6.offset-pagination', description: 'integer offset+limit query params on a markerless list envelope -> offset pagination', options: {} },
  { name: '7.allof-envelope', description: 'allOf-composed list envelope + $ref path-item cursor param -> cursor pagination', options: {} },
  { name: '8.idempotency', description: 'idempotency-key header (any casing) stripped from headerParams -> method.injectIdempotencyKey', options: {} },
];

describe('openapi2opensdk', () => {
  for (const f of fixtures) {
    it(f.description, () => {
      testFixture(f.name, f.options);
    });
  }
});

// Minimal valid doc for behavior-stamping tests (fixtures cover the surface).
const minimalDoc = (headerName?: string) =>
  ({
    openapi: '3.1.0',
    info: { title: 'demo', version: '1' },
    paths: {
      '/things': {
        post: {
          parameters: headerName ? [{ name: headerName, in: 'header', schema: { type: 'string' } }] : [],
          responses: { '200': { description: 'ok' } },
        },
      },
    },
    // biome-ignore lint/suspicious/noExplicitAny: hand-rolled test document
  }) as any;

describe('openapi2opensdk sdk behavior stamping', () => {
  it('ALWAYS stamps spec.sdk with the canonical defaults (oagen-style, never null)', () => {
    const spec = openapi2opensdk(minimalDoc());
    expect(spec.sdk).toEqual(defaultSdkBehavior());
  });

  it('deep-merges options.sdkBehavior over the defaults (arrays replace entirely)', () => {
    const spec = openapi2opensdk(minimalDoc(), {
      sdkBehavior: { retry: { maxRetries: 7, retryableStatusCodes: [429] }, timeout: { defaultTimeoutMs: 12345 } },
    });
    expect(spec.sdk).toEqual(
      mergeSdkBehavior({ retry: { maxRetries: 7, retryableStatusCodes: [429] }, timeout: { defaultTimeoutMs: 12345 } }),
    );
    expect(spec.sdk?.retry?.maxRetries).toBe(7);
    expect(spec.sdk?.retry?.retryableStatusCodes).toEqual([429]);
    expect(spec.sdk?.timeout?.defaultTimeoutMs).toBe(12345);
    // untouched policies keep their defaults
    expect(spec.sdk?.idempotency?.headerName).toBe('Idempotency-Key');
  });

  it('strips a CUSTOM idempotency header per sdk.idempotency.headerName and flags the method', () => {
    const spec = openapi2opensdk(minimalDoc('X-Custom-Idem'), {
      sdkBehavior: { idempotency: { headerName: 'X-Custom-Idem' } },
    });
    const method = spec.resources?.[0]?.methods?.[0];
    expect(method?.injectIdempotencyKey).toBe(true);
    expect(method?.headerParams).toBeUndefined();
  });

  it('a non-policy header is NOT stripped under a custom idempotency header name', () => {
    const spec = openapi2opensdk(minimalDoc('Idempotency-Key'), {
      sdkBehavior: { idempotency: { headerName: 'X-Custom-Idem' } },
    });
    const method = spec.resources?.[0]?.methods?.[0];
    expect(method?.injectIdempotencyKey).toBeUndefined();
    expect(method?.headerParams?.map((p) => p.wireName ?? p.name)).toEqual(['Idempotency-Key']);
  });
});

describe('openapi2opensdk validation-lite', () => {
  it('throws a clear error on a non-3.x document', () => {
    // biome-ignore lint/suspicious/noExplicitAny: intentionally malformed input
    expect(() => openapi2opensdk({ swagger: '2.0', info: { title: 't', version: '1' }, paths: { '/a': {} } } as any)).toThrow(
      /not an OpenAPI 3\.x document/,
    );
  });

  it('throws a clear error when the document has no paths', () => {
    // biome-ignore lint/suspicious/noExplicitAny: intentionally malformed input
    expect(() => openapi2opensdk({ openapi: '3.1.0', info: { title: 't', version: '1' } } as any)).toThrow(
      /no "paths"/,
    );
  });
});
