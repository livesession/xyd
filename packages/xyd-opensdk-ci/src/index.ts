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
