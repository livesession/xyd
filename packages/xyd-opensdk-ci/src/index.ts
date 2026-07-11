// The OpenSDK test/CI harness — shared by every emitter package's tests so a
// new language target only writes thin bindings (mirrors how oagen keeps its
// verification tooling emitter-agnostic).
export { listFiles, writeTree, hasCommand } from './golden';
export { HTTP_METHODS, collectRefs, miniDoc, eachOperation, firstMethod } from './spec';
export type { LeafMethod } from './spec';
export {
  RecordingServer,
  expectedRequest,
  mergeResources,
  loadPerMethod,
  fullIR,
  normalizeRecorded,
  diffRequest,
} from './e2e';
export type { RecordedRequest, RecordedFixture, PerMethodFixture } from './e2e';
export { MockServer } from './mock';
export { parityProbe, missingMarkers } from './parity';
export type { ParityMarker, ParityProbe } from './parity';
export {
  publishRoundTrip,
  publishE2EEnabled,
  adapterReady,
  waitFor,
  nodePublishAdapter,
  pythonPublishAdapter,
  rubyPublishAdapter,
  dotnetPublishAdapter,
  javaPublishAdapter,
  goPublishAdapter,
} from './publish';
export type { PublishAdapter, PublishCtx, PublishRoundTripConfig } from './publish';
export { listComplexCorpora, representativeMethods, CORPUS_SPECS } from './corpus';
export type { ComplexCorpus, RepresentativeMethod, CorpusSpec } from './corpus';
export { compileSmoke } from './compile-smoke';
export { compileUsageSnippet, placeSnippet } from './usage-compile';
export { recordSdkE2E, defineSdkE2E, apiKeyEnvFor } from './sdk-e2e';
export type { ApiConfig, DriverAdapter, BuiltDriver } from './sdk-e2e';
export { runUsageSnippet, SNIPPET_BASE_URL_ENV } from './snippet-run';
export type { SnippetRunner, RunUsageSnippetConfig } from './snippet-run';
