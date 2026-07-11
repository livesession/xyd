/**
 * Public (browser-safe) entry for the sdk.json wizard. Exports the UI + the
 * fetch-based preview client + the model. It MUST NOT re-export anything from
 * `./preview/*` (that entry imports `@xyd-js/*` and is Node-only — use the
 * `@apitoolchain/sdkjson-wizard/preview` subpath from a server).
 */

export type { CodePreviewProps } from "./components/CodePreview";
export { CodePreview } from "./components/CodePreview";
export type { SdkJsonWizardProps } from "./components/SdkJsonWizard";
export { SdkJsonWizard } from "./components/SdkJsonWizard";
export { createFetchPreview, PREVIEW_ENDPOINT } from "./fetch-preview";
export type { SeedSdkJsonOptions } from "./model/defaults";
export { defaultSdkJson, seedSdkJson } from "./model/defaults";
export type { FieldDef, SectionDef } from "./model/fields";
export { SECTIONS } from "./model/fields";
export type {
  GeneratePreview,
  PreviewFile,
  PreviewOperation,
  PreviewRequest,
  PreviewResult,
  SdkBehavior,
  SdkJson,
  SdkLanguage,
} from "./model/types";
export { LANGUAGE_META, SDK_LANGUAGES } from "./model/types";
