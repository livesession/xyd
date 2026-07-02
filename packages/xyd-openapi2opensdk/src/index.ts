// OpenAPI 3.x -> OpenSDK IR converter: walks the raw (un-dereferenced) document,
// resolving component schemas into named types (structs/enums/unions) and paths
// into a resource tree of typed methods.
export { openapi2opensdk, openapi2opensdkFromSource } from './openapi2opensdk';
export type { OpenApi2OpenSdkOptions, OperationHint, VerbMap } from './types';
export { DEFAULT_CUSTOM_ACTION_VERBS } from './types';

export { SymbolTable } from './nominal';
export type { SchemaOrRef } from './nominal';

// The language-agnostic conformance surface (diffed against real SDKs, e.g. openai-go).
export { opensdkToSurface, diffSurfaces, neutralType, segment } from './surface';
export type {
  SdkSurface,
  SurfaceMethod,
  SurfaceParam,
  ParamKind,
  SurfaceDiff,
  MethodDiff,
  SdkAllowlist,
} from './surface';
