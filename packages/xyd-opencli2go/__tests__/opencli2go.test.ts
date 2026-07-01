import { describe, it } from 'vitest';

import { GO_SMOKE, goBuildSmoke, testFixture } from './utils';

const tests = [
  { name: '1.basic', description: 'List + retrieve resource; bearer auth; path arg' },
  { name: '2.crud', description: 'CRUD with query flags + flattened JSON body; apiKey-header auth' },
  { name: '3.nested', description: 'Nested sub-resource, multiple path args, custom action' },
  { name: '4.body-flatten', description: 'Body flags: enum/array/number/bool/nested-json encodings' },
];

describe('opencli2go (golden Go output)', () => {
  for (const t of tests) {
    it(`[${t.name}]: ${t.description}`, () => {
      testFixture(t.name);
    });
  }
});

// Opt-in (O2G_GO_SMOKE=1 + Go toolchain + network): generated project compiles + vets.
describe.skipIf(!GO_SMOKE)('opencli2go (go build smoke)', () => {
  for (const t of tests) {
    it(`builds + vets [${t.name}]`, () => {
      goBuildSmoke(t.name);
    });
  }
});
