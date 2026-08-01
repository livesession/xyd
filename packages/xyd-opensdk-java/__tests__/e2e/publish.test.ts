import path from 'node:path';

import { describe, it } from 'vitest';

import { adapterReady, javaPublishAdapter, listComplexCorpora, publishRoundTrip } from '@xyd-js/opensdk-ci';

import { opensdkJava, publishJava } from '../../index';

// PUBLISH e2e (gated E2E_SDK_PUBLISH=1 + `mvn` + PUBLISH_MAVEN_REPO): mvn-deploy
// each complex-corpus SDK to a local file:// Maven repo, then compile a consumer
// that resolves the artifact and imports the Client (compile proves consumability).
const adapter = javaPublishAdapter();

for (const corpus of listComplexCorpora(path.join(__dirname, '../../__fixtures__'))) {
  describe.runIf(adapterReady(adapter))(`${corpus.name} publish e2e (java → Maven file:// repo)`, () => {
    it('deploys, and a consumer resolves + compiles against the artifact', async () => {
      await publishRoundTrip({
        fixturesDir: corpus.dir,
        sdkName: corpus.name,
        generate: opensdkJava,
        publish: publishJava,
        adapter,
      });
    }, 600000);
  });
}
