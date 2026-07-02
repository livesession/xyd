// OpenSDK core: the language-agnostic SDK IR (generated from opensdk-spec.json)
// plus the pure loader/helpers shared by the openapi2opensdk converter and the
// opensdk-* code generators (Go first).
export * from './types';

export { loadOpensdkSpec, findType, walkMethods } from './spec';
export type { LoadOpensdkSpecOptions, FlatMethod } from './spec';

export { defaultSdkBehavior, mergeSdkBehavior, sdkBehavior, mergeBehaviorOverrides } from './behavior';
export type { DeepPartial, ResolvedSdkBehavior } from './behavior';

export { diffIR } from './diff';
export type { IrChange, IrDiff, IrSeverity } from './diff';

export type { OperationHint, SdkGrouping, LanguageSection, SdkJson } from './config';
