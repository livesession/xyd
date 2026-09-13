import path from 'node:path';

import { defineDocsGolden } from '@xyd-js/opensdk-ci';

import { javaEmitter } from '../src/emitter';

// The docs oracle for Java: `generateUsage` + `generateTypeReference` frozen per
// operation. Generator is opt-in (O2S_BUILD_DOCS=1); the guard runs offline.
defineDocsGolden(javaEmitter, path.join(__dirname, '../__fixtures__'));
