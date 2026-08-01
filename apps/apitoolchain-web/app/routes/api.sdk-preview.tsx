import type { PreviewRequest } from "@apitoolchain/sdkjson-wizard";
import yaml from "js-yaml";
import { requireUser } from "~/auth.server";
import { fetchSpecRaw } from "~/data";
import { runOpensdkPreview } from "~/lib/sdk/preview.server";
import type { Route } from "./+types/api.sdk-preview";

/**
 * Resource route for the sdk.json wizard's live preview: POST a `PreviewRequest`
 * ({ language, sdkJson, specId? }), get back the `PreviewResult` (the REAL
 * opensdk-generated files + usage snippets). Server-only — the emitters
 * (`@xyd-js/*`) never reach the client bundle. Called debounced by the wizard.
 *
 * The wizard is an abstraction over sdk.json, so we resolve the REAL API's
 * OpenAPI from the config's `api` ref (`apis/<ns>/<id>@<version>`) and generate
 * against IT — the preview then shows the actual API's SDK code + endpoints, not
 * a bundled sample. Best-effort: a missing/unresolvable ref (or a mid-edit spec)
 * falls back to the sample inside `runOpensdkPreview`, never failing the preview.
 */
export async function action({ request }: Route.ActionArgs) {
  await requireUser();
  const body = (await request.json()) as PreviewRequest;
  const doc = await resolveApiDoc((body.sdkJson as { api?: string })?.api);
  return runOpensdkPreview(doc ? { ...body, doc } : body);
}

/** Parse an sdk.json `api` ref (`apis/<ns>/<id>@<version>`) → `{ id, version }`. */
function parseApiRef(ref?: string): { id: string; version: string } | null {
  if (!ref) return null;
  const m = /^apis\/[^/]+\/([^/@]+)@(.+)$/.exec(ref);
  return m ? { id: m[1], version: m[2] } : null;
}

// A spec is immutable for a given api@version, so cache the parsed doc (incl. a
// negative result) to avoid re-fetching/re-parsing on every debounced keystroke.
const docCache = new Map<string, Record<string, unknown> | undefined>();

/** Resolve the RAW (un-dereferenced) OpenAPI doc for an sdk.json `api` ref, or
 * `undefined` when there's none / it can't be loaded. `openapi2opensdk` wants the
 * raw `$ref`'d doc, so a plain YAML/JSON parse (no dereference) is exactly right
 * and cheap. */
async function resolveApiDoc(
  apiRef?: string,
): Promise<Record<string, unknown> | undefined> {
  const parsed = parseApiRef(apiRef);
  if (!parsed) return undefined;
  const key = `${parsed.id}@${parsed.version}`;
  if (docCache.has(key)) return docCache.get(key);
  let doc: Record<string, unknown> | undefined;
  try {
    const spec = await fetchSpecRaw(parsed.id, parsed.version);
    const loaded = yaml.load(spec.text); // YAML is a JSON superset — handles both
    doc =
      loaded && typeof loaded === "object"
        ? (loaded as Record<string, unknown>)
        : undefined;
  } catch {
    doc = undefined; // never fail the preview — fall back to the sample
  }
  // Cache only a successful (immutable) resolution. A transient fetch/parse
  // failure must NOT stick the whole session on the sample — leave it uncached so
  // the next debounced request retries.
  if (doc !== undefined) docCache.set(key, doc);
  return doc;
}
