// The SDK-usage-example enrichment now lives in the shared @xyd-js/opensdk-uniform
// package so every xyd docs site — not just this editor — can render property-filled
// SDK code tabs. Re-exported here (server-only) to keep the existing import path
// (toGroups.server.ts) stable; the emitters + openapi2opensdk never reach the client
// bundle (aliased server-only in vite.config.ts).
export { attachSdkExamples, attachSdkTypes } from "@xyd-js/opensdk-uniform";
