import path from 'node:path';

import { defineDocsGolden } from '@xyd-js/opensdk-ci';

import { goEmitter } from '../src/emitter';

// The docs oracle for Go: `generateUsage` + `generateTypeReference` frozen per
// operation. Generator is opt-in (O2S_BUILD_DOCS=1); the guard runs offline.
defineDocsGolden(goEmitter, path.join(__dirname, '../__fixtures__'));
