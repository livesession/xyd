import { describe, it } from 'vitest';

import { testFixture } from './utils';
import type { OpenApi2OpenCliOptions } from '../index';

const tests: { name: string; description: string; options?: OpenApi2OpenCliOptions }[] = [
  {
    name: '1.basic',
    description: 'List + retrieve on a single resource (servers + security binding)',
  },
  {
    name: '2.crud',
    description: 'Full list/create/retrieve/update/delete with a flattened JSON body',
  },
  {
    name: '3.nested',
    description: 'Nested sub-resource, multiple path params, and a custom action (archive)',
  },
  {
    name: '4.body-flatten',
    description: 'Hybrid body strategy: scalars/enums/arrays flatten, nested objects → JSON flag',
  },
  {
    name: '5.responses',
    description: 'Response binding: schema-sampled example + curated example → x-openapi.responses',
  },
];

describe('openapi2opencli', () => {
  for (const t of tests) {
    it(`[${t.name}]: ${t.description}`, async () => {
      await testFixture(t.name, t.options);
    });
  }
});
