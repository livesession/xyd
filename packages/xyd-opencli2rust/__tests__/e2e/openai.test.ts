import path from 'node:path';

import { defineE2E } from './harness';

// Fixtures are synced copies from xyd-opencli2go (O2R_BUILD_DOCS=1 re-syncs).
defineE2E({
  name: 'openai',
  cliName: 'openai',
  fixturesDir: path.join(__dirname, '../../__fixtures__/-2.complex.openai'),
});
