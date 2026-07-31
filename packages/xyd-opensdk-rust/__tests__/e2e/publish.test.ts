import path from 'node:path';

import { describe, it } from 'vitest';

import { adapterReady, publishRoundTrip, rustPublishAdapter } from '@xyd-js/opensdk-ci';

import { opensdkRust, publishRust } from '../../index';

// PUBLISH e2e (gated E2E_SDK_PUBLISH=1 + `cargo` + PUBLISH_CARGO_REGISTRY): package
// the openai SDK, then build a scratch consumer crate that depends on it via a
// path dependency (reduced-fidelity local feed — see rustPublishAdapter).
const adapter = rustPublishAdapter();
const FIXTURES = path.join(__dirname, '../../__fixtures__/-2.complex.openai');

describe.runIf(adapterReady(adapter))('openai publish e2e (rust → cargo path feed)', () => {
  it('packages, and a consumer crate builds against it', async () => {
    await publishRoundTrip({ fixturesDir: FIXTURES, sdkName: 'openai', generate: opensdkRust, publish: publishRust, adapter });
  }, 600000);
});
