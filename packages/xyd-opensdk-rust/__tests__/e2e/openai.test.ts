import path from 'node:path';

import { runGeneratedTests } from './harness';

// OpenAI binding for the Rust generated-SDK e2e harness. The whole SDK is
// assembled from the committed per-method OpenSDK IR inputs (no OpenAPI/upstream
// dependency) and its own #[tokio::test] suite is run against a spec-shaped mock.
// The per-method openai fixtures are produced from the converter oracle
// (O2S_BUILD_DOCS with XYD_CONTENT_SECRET); until they are committed this dir is
// empty and the harness merges to an empty SDK (still a valid, gated run).
const openai = {
  name: 'openai',
  sdkName: 'openai',
  fixturesDir: path.join(__dirname, '../../__fixtures__/-2.complex.openai'),
};

runGeneratedTests(openai);
