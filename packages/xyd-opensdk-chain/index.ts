// @xyd-js/opensdk-chain — the `opensdk run` engine: chain.json (sources → targets)
// + the OpenAPI sources layer (merge inputs + apply overlays). Generation/publishing
// are injected by the CLI, so this package depends only on core + framework (types).
export { runChain } from './src/run';
export type { RunChainOptions, GenerateTargetOptions } from './src/run';
export { resolveChain, detectChain } from './src/chain';
export { mergeOpenApiDocs, applyOverlay, processSource, readRawDoc, serializeDoc } from './src/sources';
