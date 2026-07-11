import path from 'node:path';

import { describe, it } from 'vitest';

import { adapterReady, goPublishAdapter, listComplexCorpora, publishRoundTrip } from '@xyd-js/opensdk-ci';

import { opensdkGo, publishGo } from '../../index';

// PUBLISH e2e (gated E2E_SDK_PUBLISH=1 + `go` + PUBLISH_GOPROXY_DIR): tag each
// complex-corpus SDK module (Go's "publish" is a git tag), then a consumer module
// resolves + compiles against it. Reduced fidelity — see goPublishAdapter().
const adapter = goPublishAdapter();

for (const corpus of listComplexCorpora(path.join(__dirname, '../../__fixtures__'))) {
  describe.runIf(adapterReady(adapter))(`${corpus.name} publish e2e (go → git tag + module consume)`, () => {
    it('tags the module and a consumer compiles against it', async () => {
      await publishRoundTrip({
        fixturesDir: corpus.dir,
        sdkName: corpus.name,
        generate: opensdkGo,
        publish: publishGo,
        adapter,
      });
    }, 600000);
  });
}
