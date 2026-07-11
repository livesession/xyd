import path from 'node:path';

import { describe, it } from 'vitest';

import { adapterReady, listComplexCorpora, publishRoundTrip, pythonPublishAdapter } from '@xyd-js/opensdk-ci';

import { opensdkPython, publishPython } from '../../index';

// PUBLISH e2e (gated E2E_SDK_PUBLISH=1 + `python3` + PUBLISH_PYPI_URL): build +
// twine-upload each complex-corpus SDK to the local PyPI (pypiserver),
// pip-install it back into a scratch consumer, and import it.
const adapter = pythonPublishAdapter();

for (const corpus of listComplexCorpora(path.join(__dirname, '../../__fixtures__'))) {
  describe.runIf(adapterReady(adapter))(`${corpus.name} publish e2e (python → PyPI/pypiserver)`, () => {
    it('builds, uploads, pip-installs from the index, and imports the package', async () => {
      await publishRoundTrip({
        fixturesDir: corpus.dir,
        sdkName: corpus.name,
        generate: opensdkPython,
        publish: publishPython,
        adapter,
      });
    }, 600000);
  });
}
