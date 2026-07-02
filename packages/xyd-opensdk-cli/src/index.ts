// The OpenSDK CLI (oagen's src/cli analog): `opensdk parse | generate | diff | init`.
// Built-in emitters (go, python) are registered at startup; an
// opensdk.config.{ts,js,mjs} plugin bundle can register more.
export { main, registerBuiltinEmitters } from './cli/index';
export { parseCommand } from './cli/parse';
export { generateCommand, loadIR } from './cli/generate';
export { diffCommand } from './cli/diff';
export type { DiffCommandOptions, DiffFailOn } from './cli/diff';
export { initCommand } from './cli/init';
export { loadConfig } from './cli/config-loader';
export type { OpensdkCliConfig } from './cli/config-loader';
export { converterOptions, loadGrouping } from './cli/grouping';
export type { ConverterInputs, GroupingOverrides } from './cli/grouping';
export { applyConfig } from './cli/plugin-loader';
