// The OpenCLI model + helpers now live in @xyd-js/opencli; re-export them so
// existing consumers of @xyd-js/opencli-remark keep working.
export * from '@xyd-js/opencli';
export { remarkOpencliDocs, type OpencliDocsOptions } from './src/remark-opencli';
