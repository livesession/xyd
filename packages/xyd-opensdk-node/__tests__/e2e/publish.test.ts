import path from 'node:path';

import { describe, it } from 'vitest';

import { adapterReady, listComplexCorpora, nodePublishAdapter, publishRoundTrip } from '@xyd-js/opensdk-ci';

import { opensdkNode, publishNode } from '../../index';

// PUBLISH e2e (gated E2E_SDK_PUBLISH=1 + `npm` + PUBLISH_NPM_REGISTRY): generate
// each complex-corpus SDK, publish it to the local npm registry (verdaccio), install
// it back into a scratch consumer, and load it. Proves the whole publish path.
const adapter = nodePublishAdapter();

for (const corpus of listComplexCorpora(path.join(__dirname, '../../__fixtures__'))) {
  describe.runIf(adapterReady(adapter))(`${corpus.name} publish e2e (node → npm/verdaccio)`, () => {
    it('publishes, installs from the registry, and the smoke loads the Client', async () => {
      await publishRoundTrip({
        fixturesDir: corpus.dir,
        sdkName: corpus.name,
        generate: opensdkNode,
        publish: publishNode,
        adapter,
      });
    }, 600000);
  });
}
