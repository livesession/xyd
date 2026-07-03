import path from 'node:path';

import { describe, it } from 'vitest';

import { adapterReady, goPublishAdapter, publishRoundTrip } from '@xyd-js/opensdk-ci';

import { opensdkGo } from '../../index';

// PUBLISH e2e (gated E2E_SDK_PUBLISH=1 + `go` + PUBLISH_GOPROXY_DIR): tag the
// openai SDK module (Go's "publish" is a git tag), then a consumer module
// resolves + compiles against it. Reduced fidelity — see goPublishAdapter().
const adapter = goPublishAdapter();
const FIXTURES = path.join(__dirname, '../../__fixtures__/-2.complex.openai');

describe.runIf(adapterReady(adapter))('openai publish e2e (go → git tag + module consume)', () => {
  it('tags the module and a consumer compiles against it', async () => {
    await publishRoundTrip({ fixturesDir: FIXTURES, sdkName: 'openai', generate: opensdkGo, adapter });
  }, 600000);
});
