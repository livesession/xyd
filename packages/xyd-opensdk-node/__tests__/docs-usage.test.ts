import path from 'node:path';

import { defineDocsGolden } from '@xyd-js/opensdk-ci';

import { nodeEmitter } from '../src/emitter';

// The docs oracle for Node: `generateUsage` + `generateTypeReference` frozen per
// operation. Generator is opt-in (O2S_BUILD_DOCS=1); the guard runs offline.
defineDocsGolden(nodeEmitter, path.join(__dirname, '../__fixtures__'));
