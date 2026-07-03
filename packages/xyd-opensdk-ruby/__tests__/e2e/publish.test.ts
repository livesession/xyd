import path from 'node:path';

import { describe, it } from 'vitest';

import { adapterReady, publishRoundTrip, rubyPublishAdapter } from '@xyd-js/opensdk-ci';

import { opensdkRuby } from '../../index';

// PUBLISH e2e (gated E2E_SDK_PUBLISH=1 + `gem` + PUBLISH_GEM_HOST): gem-build +
// gem-push the openai SDK to the local gem server (gemstash), gem-install it back
// into a scratch consumer, and require it.
const adapter = rubyPublishAdapter();
const FIXTURES = path.join(__dirname, '../../__fixtures__/-2.complex.openai');

describe.runIf(adapterReady(adapter))('openai publish e2e (ruby → RubyGems/gemstash)', () => {
  it('builds, pushes, gem-installs from the host, and requires the gem', async () => {
    await publishRoundTrip({ fixturesDir: FIXTURES, sdkName: 'openai', generate: opensdkRuby, adapter });
  }, 600000);
});
