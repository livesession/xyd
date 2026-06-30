// OpenCLI core: the data model (generated from opencli-spec.json) plus the
// pure spec/loader/generator helpers shared by opencli-remark and the
// openapi2opencli / opencli2* code generators.
export * from './types';

export { loadOpencliSpec, findCommand } from './spec';
export type { LoadOpencliSpecOptions } from './spec';

export {
  generateUsage,
  generateDescription,
  generateArguments,
  generateOptions,
  generateCommands,
  generateFlags,
} from './generate';
export type { IndentStyle } from './generate';

export { opencliToReferences } from './converters';
export type { OpencliReference, OpencliToReferencesOptions } from './converters';
