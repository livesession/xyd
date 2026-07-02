// The OpenSDK generation framework (oagen-style): language emitters are PLUGINS
// implementing the Emitter contract; the orchestrator drives them over the IR
// and assembles the virtual file map. Layering (enforced by the architecture
// test): core <- framework <- emitters/ci; the framework never imports an emitter.
export type {
  Emitter,
  EmitterContext,
  GeneratedFile,
  GeneratedFileEntry,
  OpensdkConfig,
  ProjectFileMap,
  WriteMode,
} from './types';
export { registerEmitter, getEmitter, applyConfig, resolveLanguage, languageAliases } from './registry';
export { generate, generateFileMap } from './orchestrator';
export { writeProject, deepMergeJson, MANIFEST_FILENAME } from './write';
export type { ProjectManifest, WriteProjectOptions, WriteProjectResult } from './write';
export { planOperation } from './operation-plan';
export type {
  BodyEncoding,
  OperationParamGroups,
  OperationPlan,
  PageName,
  PrimaryResponseKind,
} from './operation-plan';
export { planExample, exampleFields, planMethodExample } from './example-plan';
export type { ExampleValue, ExampleField, MethodExample, PlanExampleOptions } from './example-plan';
