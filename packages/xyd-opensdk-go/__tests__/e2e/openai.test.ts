import path from 'node:path';

import { defineE2E, recordE2E, runGeneratedTests } from './harness';

// OpenAI binding for the reusable opensdk-go e2e harness. Adding another API is
// this small: point at its per-method fixtures dir. The whole SDK is assembled
// from the committed OpenSDK IR inputs — no OpenAPI/upstream dependency.
const openai = {
  name: 'openai',
  sdkName: 'openai',
  fixturesDir: path.join(__dirname, '../../__fixtures__/-2.complex.openai'),
};

recordE2E(openai);
defineE2E(openai);
runGeneratedTests(openai);
