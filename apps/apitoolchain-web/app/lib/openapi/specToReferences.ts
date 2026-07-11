import $RefParser from "@apidevtools/json-schema-ref-parser";
import { oapSchemaToReferences } from "@xyd-js/openapi";
import type { Reference } from "@xyd-js/uniform";
import { Buffer } from "buffer";
import yaml from "js-yaml";
import type { OpenAPIV3 } from "openapi-types";

// `@apidevtools/json-schema-ref-parser` touches `Buffer` at parse time
// (`Buffer.isBuffer` / `Buffer.from`). Browsers don't ship it — install the npm
// polyfill once, globally, before the parser ever runs. No-op under Node/Bun.
if (typeof (globalThis as { Buffer?: unknown }).Buffer === "undefined") {
  (globalThis as { Buffer?: unknown }).Buffer = Buffer;
}

/**
 * Parse + fully dereference OpenAPI text into the document `oapSchemaToReferences`
 * expects. Browser-safe replacement for xyd's Node-only `deferencedOpenAPI`
 * (which reads from `fs`) — mirrors apiatlas's `loadOpenAPIDocument`. Runs on
 * both the server (loader / resource route) and the client (live re-render).
 *
 * v1 speaks OpenAPI 3 only; a Swagger 2.0 document throws the "no openapi field"
 * error rather than silently mis-rendering.
 */
export async function specTextToDocument(
  text: string,
): Promise<{ doc: OpenAPIV3.Document; raw: OpenAPIV3.Document }> {
  // YAML is a JSON superset, so this handles both spec encodings.
  const parsed = yaml.load(text);
  if (!parsed || typeof parsed !== "object") {
    throw new Error(
      "Spec did not parse to an object — is it valid OpenAPI JSON/YAML?",
    );
  }
  // Keep a pristine, still-$ref'd clone BEFORE dereferencing: `openapi2opensdk`
  // (SDK-usage examples) wants the RAW document so component identity survives
  // into nominal types — and ref-parser dereferences `parsed` IN PLACE.
  const raw = JSON.parse(JSON.stringify(parsed)) as OpenAPIV3.Document;
  // `circular: true` keeps real object cycles for recursive schemas (uniform
  // conversion tolerates them).
  const dereferenced = (await $RefParser.dereference(parsed as object, {
    dereference: { circular: true },
  })) as OpenAPIV3.Document;
  if (!dereferenced.openapi) {
    throw new Error(
      "Document has no `openapi` version field — not an OpenAPI 3 spec?",
    );
  }
  return { doc: dereferenced, raw };
}

/** OpenAPI text → uniform `Reference[]` (one per operation) for xyd Atlas. */
export async function specTextToReferences(text: string): Promise<Reference[]> {
  const { doc } = await specTextToDocument(text);
  return oapSchemaToReferences(doc);
}

/**
 * Like {@link specTextToReferences}, but also returns the RAW un-dereferenced
 * document — the input `openapi2opensdk` needs to build the SDK IR for usage
 * examples (see `sdkExamples.server.ts`).
 */
export async function specTextToReferencesAndRaw(
  text: string,
): Promise<{ references: Reference[]; raw: OpenAPIV3.Document }> {
  const { doc, raw } = await specTextToDocument(text);
  return { references: oapSchemaToReferences(doc), raw };
}
