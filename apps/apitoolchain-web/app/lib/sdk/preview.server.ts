// Server-only: the sdk.json wizard's preview backend runs the REAL opensdk
// emitters (@xyd-js/*). The `.server` suffix keeps it — and its Node deps — out
// of the client bundle (same discipline as sdkExamples.server.ts).
export { runOpensdkPreview } from "@apitoolchain/sdkjson-wizard/preview";
