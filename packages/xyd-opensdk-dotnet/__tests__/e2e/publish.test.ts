import path from 'node:path';

import { describe, it } from 'vitest';

import { adapterReady, dotnetPublishAdapter, publishRoundTrip } from '@xyd-js/opensdk-ci';

import { opensdkDotnet, publishDotnet } from '../../index';

// PUBLISH e2e (gated E2E_SDK_PUBLISH=1 + `dotnet` + PUBLISH_NUGET_FEED): pack the
// openai SDK, push the .nupkg to a local folder feed, then restore + build a
// consumer that references it (restore proves the package is fetchable).
const adapter = dotnetPublishAdapter();
const FIXTURES = path.join(__dirname, '../../__fixtures__/-2.complex.openai');

describe.runIf(adapterReady(adapter))('openai publish e2e (dotnet → NuGet folder feed)', () => {
  it('packs, pushes, and a consumer restores + builds against the package', async () => {
    await publishRoundTrip({ fixturesDir: FIXTURES, sdkName: 'openai', generate: opensdkDotnet, publish: publishDotnet, adapter });
  }, 600000);
});
