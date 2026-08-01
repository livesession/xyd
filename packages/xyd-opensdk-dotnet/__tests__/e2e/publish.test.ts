import path from 'node:path';

import { describe, it } from 'vitest';

import { adapterReady, dotnetPublishAdapter, listComplexCorpora, publishRoundTrip } from '@xyd-js/opensdk-ci';

import { opensdkDotnet, publishDotnet } from '../../index';

// PUBLISH e2e (gated E2E_SDK_PUBLISH=1 + `dotnet` + PUBLISH_NUGET_FEED): pack each
// complex-corpus SDK, push the .nupkg to a local folder feed, then restore + build a
// consumer that references it (restore proves the package is fetchable).
const adapter = dotnetPublishAdapter();

for (const corpus of listComplexCorpora(path.join(__dirname, '../../__fixtures__'))) {
  describe.runIf(adapterReady(adapter))(`${corpus.name} publish e2e (dotnet → NuGet folder feed)`, () => {
    it('packs, pushes, and a consumer restores + builds against the package', async () => {
      await publishRoundTrip({
        fixturesDir: corpus.dir,
        sdkName: corpus.name,
        generate: opensdkDotnet,
        publish: publishDotnet,
        adapter,
      });
    }, 600000);
  });
}
