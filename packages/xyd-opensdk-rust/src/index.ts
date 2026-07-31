// The OpenSDK Rust emitter: OpenSDK IR -> a buildable, idiomatic async Rust SDK
// (reqwest + tokio + serde). Mirrors @xyd-js/opensdk-go / @xyd-js/opensdk-ruby —
// same Emitter contract, same shared framework helpers, a language-native output.
export { rustEmitter, opensdkRust } from './emitter';
export { publishRust } from './publish';
// Re-exported so the tests can write a generated project to disk exactly like
// the Go/Ruby/Python emitter packages do (`import { opensdkRust, writeProject }`).
export { writeProject } from '@xyd-js/opensdk-framework';
export type { OpensdkRustOptions } from './types';
