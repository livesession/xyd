import path from 'node:path';

import { runGeneratedTests } from './harness';

// OpenAI binding for the Java generated-SDK e2e harness. The whole SDK is
// assembled from the committed OpenSDK IR inputs (no OpenAPI/upstream
// dependency) and its own dependency-free assertion suite is run against a
// spec-shaped mock.
const openai = {
  name: 'openai',
  sdkName: 'openai',
  fixturesDir: path.join(__dirname, '../../__fixtures__/-2.complex.openai'),
};

runGeneratedTests(openai);
