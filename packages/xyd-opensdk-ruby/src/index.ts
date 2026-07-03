// The OpenSDK Ruby emitter: OpenSDK IR -> a buildable, stdlib-only, openai-ruby
// shaped Ruby SDK. Mirrors @xyd-js/opensdk-go and @xyd-js/opensdk-python — same
// Emitter contract, same shared framework helpers, a language-native output.
export { rubyEmitter, opensdkRuby } from './emitter';
export { publishRuby } from './publish';
export { errorClassNames } from './runtime';
// Re-exported so the tests can write a generated project to disk exactly like
// the Go/Python emitter packages do (`import { opensdkRuby, writeProject }`).
export { writeProject } from '@xyd-js/opensdk-framework';
export type { OpensdkRubyOptions } from './types';
