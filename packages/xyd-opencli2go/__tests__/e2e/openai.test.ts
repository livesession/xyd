import path from 'node:path';

import { defineE2E, recordE2E } from './harness';

// OpenAI binding for the reusable e2e harness. Adding another API is this small:
// point at its per-method fixtures dir. The full CLI is assembled from the
// committed OpenCLI inputs — no OpenAPI/upstream dependency.
const openai = { name: 'openai', cliName: 'openai', fixturesDir: path.join(__dirname, '../../__fixtures__/-2.complex.openai') };

recordE2E(openai);
defineE2E(openai);
