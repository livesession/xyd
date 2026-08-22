import { describe, it } from 'vitest';

import { CARGO_SMOKE, cargoCheckSmoke, testFixture } from './utils';

const FIXTURES = ['1.basic', '2.crud', '3.nested', '4.body-flatten', '6.local-tool', '7.mixed'];

describe('opencli2rust golden fixtures', () => {
  for (const name of FIXTURES) {
    it(name, () => {
      testFixture(name);
    });
  }
});

describe.runIf(CARGO_SMOKE)('opencli2rust cargo smoke', () => {
  for (const name of FIXTURES) {
    it(`${name} cargo check`, () => {
      cargoCheckSmoke(name);
    });
  }
});
