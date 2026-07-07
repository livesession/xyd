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
): Promise<OpenAPIV3.Document> {
  // YAML is a JSON superset, so this handles both spec encodings.
  const parsed = yaml.load(text);
  if (!parsed || typeof parsed !== "object") {
    throw new Error(
      "Spec did not parse to an object — is it valid OpenAPI JSON/YAML?",
    );
  }
  // ref-parser mutates in place; `circular: true` keeps real object cycles for
  // recursive schemas (uniform conversion tolerates them).
  const dereferenced = (await $RefParser.dereference(parsed as object, {
    dereference: { circular: true },
  })) as OpenAPIV3.Document;
  if (!dereferenced.openapi) {
    throw new Error(
      "Document has no `openapi` version field — not an OpenAPI 3 spec?",
    );
  }
  return dereferenced;
}

/** OpenAPI text → uniform `Reference[]` (one per operation) for xyd Atlas. */
export async function specTextToReferences(text: string): Promise<Reference[]> {
  const doc = await specTextToDocument(text);
  return oapSchemaToReferences(doc);
}
