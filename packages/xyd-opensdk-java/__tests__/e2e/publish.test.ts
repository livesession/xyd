import path from 'node:path';

import { describe, it } from 'vitest';

import { adapterReady, javaPublishAdapter, publishRoundTrip } from '@xyd-js/opensdk-ci';

import { opensdkJava } from '../../index';

// PUBLISH e2e (gated E2E_SDK_PUBLISH=1 + `mvn` + PUBLISH_MAVEN_REPO): mvn-deploy
// the openai SDK to a local file:// Maven repo, then compile a consumer that
// resolves the artifact and imports the Client (compile proves consumability).
const adapter = javaPublishAdapter();
const FIXTURES = path.join(__dirname, '../../__fixtures__/-2.complex.openai');

describe.runIf(adapterReady(adapter))('openai publish e2e (java → Maven file:// repo)', () => {
  it('deploys, and a consumer resolves + compiles against the artifact', async () => {
    await publishRoundTrip({ fixturesDir: FIXTURES, sdkName: 'openai', generate: opensdkJava, adapter });
  }, 600000);
});
