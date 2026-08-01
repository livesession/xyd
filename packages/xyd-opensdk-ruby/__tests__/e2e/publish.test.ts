import path from 'node:path';

import { describe, it } from 'vitest';

import { adapterReady, listComplexCorpora, publishRoundTrip, rubyPublishAdapter } from '@xyd-js/opensdk-ci';

import { opensdkRuby, publishRuby } from '../../index';

// PUBLISH e2e (gated E2E_SDK_PUBLISH=1 + `gem` + PUBLISH_GEM_HOST): gem-build +
// gem-push each complex-corpus SDK to the local gem server (gemstash), gem-install
// it back into a scratch consumer, and require it.
const adapter = rubyPublishAdapter();

for (const corpus of listComplexCorpora(path.join(__dirname, '../../__fixtures__'))) {
  describe.runIf(adapterReady(adapter))(`${corpus.name} publish e2e (ruby → RubyGems/gemstash)`, () => {
    it('builds, pushes, gem-installs from the host, and requires the gem', async () => {
      await publishRoundTrip({
        fixturesDir: corpus.dir,
        sdkName: corpus.name,
        generate: opensdkRuby,
        publish: publishRuby,
        adapter,
      });
    }, 600000);
  });
}
