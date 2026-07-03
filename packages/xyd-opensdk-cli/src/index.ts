// The OpenSDK CLI (oagen's src/cli analog): `opensdk parse | generate | diff | init`.
// Built-in emitters (go, python) are registered at startup; an
// opensdk.config.{ts,js,mjs} plugin bundle can register more.
export { main, registerBuiltinEmitters } from './cli/index';
export { parseCommand } from './cli/parse';
export { generateCommand, generateTargets, loadIR } from './cli/generate';
export { diffCommand } from './cli/diff';
export type { DiffCommandOptions, DiffFailOn } from './cli/diff';
export { publishCommand, publishTarget } from './cli/publish';
export type { PublishCommandOptions, PublishTargetRun } from './cli/publish';
export { initCommand } from './cli/init';
export { loadConfig, loadConfigFile, CONFIG_NAMES } from './cli/config-loader';
export type { OpensdkCliConfig } from './cli/config-loader';
export { converterOptions, loadGrouping } from './cli/grouping';
export type { ConverterInputs, GroupingOverrides } from './cli/grouping';
export { applyConfig } from './cli/plugin-loader';
// Config-source registry — the extensibility seam (sdk.json today; a future
// chain.json / publish profiles are just more ConfigSources).
export { resolveConfig, configSources } from './cli/config/source';
export type { ConfigSource } from './cli/config/source';
export type { ResolvedConfig, ResolvedTarget } from './cli/config/types';
export { sdkJsonSource } from './cli/config/sources/sdk-json';
// SdkJson / LanguageSection are defined in @xyd-js/opensdk-core; re-export for convenience.
export type { SdkJson, LanguageSection } from '@xyd-js/opensdk-core';
export { opensdkConfigSource } from './cli/config/sources/opensdk-config';
