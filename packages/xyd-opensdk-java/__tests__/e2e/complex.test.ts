import path from 'node:path';

import { listComplexCorpora } from '@xyd-js/opensdk-ci';

import { defineE2E, recordE2E, runGeneratedTests } from './harness';

// Every committed complex corpus (`__fixtures__/<n>.complex.<name>/`) gets the full
// e2e battery from the reusable opensdk-java harness: (gated) record recorded.json,
// the always-on offline request-binding guard, and (gated) the real-SDK request
// diff + generated-test run. Adding another complex API (stripe, github, …) is just
// dropping its per-method fixtures — no change here. The whole SDK is assembled
// from the committed OpenSDK IR inputs — no OpenAPI/upstream dependency.
for (const corpus of listComplexCorpora(path.join(__dirname, '../../__fixtures__'))) {
  const cfg = { name: corpus.name, sdkName: corpus.name, fixturesDir: corpus.dir };
  recordE2E(cfg); // (gated E2E_RECORD=1) write per-method recorded.json
  defineE2E(cfg); // offline binding guard (always) + real-SDK request diff (gated E2E_SDK=1)
  runGeneratedTests(cfg); // (gated E2E_SDK_TESTS=1) run the SDK's OWN test suite vs a mock
}
