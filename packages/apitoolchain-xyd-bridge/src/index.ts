/**
 * @apitoolchain/xyd-bridge — the single, controlled surface the apitoolchain
 * backend services consume from the xyd monorepo.
 *
 * The apitoolchain services are standalone **bun islands** outside the xyd
 * **pnpm** workspace, so they cannot resolve `@xyd-js/*` `workspace:*` deps
 * directly. This package re-exports exactly what they need and is bundled to a
 * self-contained `dist/` (esbuild, run from the xyd node_modules context), then
 * `file:`-linked by each service. Rebuild (`bun run build`) after any xyd
 * opensdk/openapi change — the islands consume dist, not src.
 */

// ── OpenAPI / GraphQL / MCP → uniform (spec parse + validation + metadata) ──
export { deferencedOpenAPI, oapSchemaToReferences } from "@xyd-js/openapi";
export { gqlSchemaToReferences } from "@xyd-js/gql";
export { mcpUrlToReferences } from "@xyd-js/mcp-uniform";

// ── OpenAPI → OpenSDK IR (RAW, un-dereferenced doc in; IR out) ──
export {
  openapi2opensdk,
  openapi2opensdkFromSource,
} from "@xyd-js/openapi2opensdk";

// ── OpenSDK IR → per-language file map (in-memory, no disk) ──
export { registerBuiltinEmitters } from "@xyd-js/opensdk-cli";
export {
  getEmitter,
  resolveLanguage,
  generate,
  generateFileMap,
} from "@xyd-js/opensdk-framework";

// ── OpenSDK IR ⇄ IR breaking-change diff (drives release version + changelog) ──
export { diffIR } from "@xyd-js/opensdk-core";

// ── Generated SDK → package registry (the SAME per-language pack/push the
//    publish e2e drives; shells out to npm/twine/gem/… on the host) ──
export { publishTarget } from "@xyd-js/opensdk-cli";

// ── Types ──
export type { OpensdkSpecJson } from "@xyd-js/opensdk-core";
export type { IrChange, IrDiff, IrSeverity } from "@xyd-js/opensdk-core";
export type { EmitterPublishOptions } from "@xyd-js/opensdk-framework";
