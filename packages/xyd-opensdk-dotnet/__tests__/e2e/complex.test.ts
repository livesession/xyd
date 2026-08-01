import path from 'node:path';

import { listComplexCorpora } from '@xyd-js/opensdk-ci';

import { defineE2E, recordE2E, runGeneratedTests } from './harness';

// Every committed complex corpus (`__fixtures__/<n>.complex.<name>/`) gets the full
// e2e battery from the reusable opensdk-dotnet harness: (gated) record recorded.json,
// the always-on offline request-binding guard, and (gated) the real-SDK request
// diff + generated-test run. Adding another complex API (stripe, github, …) is just
// dropping its per-method fixtures — no change here.
for (const corpus of listComplexCorpora(path.join(__dirname, '../../__fixtures__'))) {
  const cfg = { name: corpus.name, sdkName: corpus.name, fixturesDir: corpus.dir };
  recordE2E(cfg);
  defineE2E(cfg);
  runGeneratedTests(cfg);
}
