import path from 'node:path';

import { describe, it } from 'vitest';

import { adapterReady, publishRoundTrip, pythonPublishAdapter } from '@xyd-js/opensdk-ci';

import { opensdkPython, publishPython } from '../../index';

// PUBLISH e2e (gated E2E_SDK_PUBLISH=1 + `python3` + PUBLISH_PYPI_URL): build +
// twine-upload the openai SDK to the local PyPI (pypiserver), pip-install it back
// into a scratch consumer, and import it.
const adapter = pythonPublishAdapter();
const FIXTURES = path.join(__dirname, '../../__fixtures__/-2.complex.openai');

describe.runIf(adapterReady(adapter))('openai publish e2e (python → PyPI/pypiserver)', () => {
  it('builds, uploads, pip-installs from the index, and imports the package', async () => {
    await publishRoundTrip({ fixturesDir: FIXTURES, sdkName: 'openai', generate: opensdkPython, publish: publishPython, adapter });
  }, 600000);
});
