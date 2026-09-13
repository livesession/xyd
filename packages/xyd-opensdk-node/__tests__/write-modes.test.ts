import path from 'node:path';

import { defineWriteModeGolden } from '@xyd-js/opensdk-ci';

import { nodeEmitter } from '../src/emitter';

// The write-mode oracle: which generated files are NOT plain 'overwrite'.
// The Rust emitters do not produce this yet, so the orchestrator still calls the
// TypeScript generateProject to rebuild it — freeze it before that TS can go.
defineWriteModeGolden(nodeEmitter, path.join(__dirname, '../__fixtures__'));
