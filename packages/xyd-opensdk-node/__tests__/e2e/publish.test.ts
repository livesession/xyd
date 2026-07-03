import path from 'node:path';

import { describe, it } from 'vitest';

import { adapterReady, nodePublishAdapter, publishRoundTrip } from '@xyd-js/opensdk-ci';

import { opensdkNode } from '../../index';

// PUBLISH e2e (gated E2E_SDK_PUBLISH=1 + `npm` + PUBLISH_NPM_REGISTRY): generate
// the openai SDK, publish it to the local npm registry (verdaccio), install it
// back into a scratch consumer, and load it. Proves the whole publish path.
const adapter = nodePublishAdapter();
const FIXTURES = path.join(__dirname, '../../__fixtures__/-2.complex.openai');

describe.runIf(adapterReady(adapter))('openai publish e2e (node → npm/verdaccio)', () => {
  it('publishes, installs from the registry, and the smoke loads the Client', async () => {
    await publishRoundTrip({ fixturesDir: FIXTURES, sdkName: 'openai', generate: opensdkNode, adapter });
  }, 600000);
});
