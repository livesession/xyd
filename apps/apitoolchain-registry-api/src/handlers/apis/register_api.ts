import type { Apis } from "../../../generated/src/generated/models/all/registry-api";
import * as q from "../../db/generated/registry_sql";
import { pool } from "../../db/pool";
import { toRegistryEntryCore } from "../../mappers";
import { ingestSpec, SpecError } from "../../spec/ingest";
import { storage } from "../../storage";
import { sha256, slugify } from "../../util";
import { invalid } from "../errors";

/**
 * POST /apis — resolve the spec text (inline or URL), validate + classify it,
 * store the RAW bytes in object storage, and upsert the api + version rows.
 */
export const registerApi: Apis["register"] = async (_ctx, input) => {
  let text: string;
  if (input.specText) {
    text = input.specText;
  } else if (input.url) {
    try {
      const r = await fetch(input.url, { signal: AbortSignal.timeout(15000) });
      if (!r.ok) return invalid(`could not fetch spec (HTTP ${r.status})`);
      text = await r.text();
    } catch (e) {
      return invalid(`could not fetch spec: ${(e as Error).message}`);
    }
  } else {
    return invalid("provide either specText or url");
  }

  // Derive kind from either an explicit kind OR a jsonschema format, so the two
  // never disagree (a jsonschema doc is always a schema).
  const kind =
    input.kind === "schema" || input.format === "jsonschema" ? "schema" : "api";

  let ing: ReturnType<typeof ingestSpec>;
  try {
    ing = ingestSpec(text, {
      format: input.format,
      version: input.version,
      kind,
    });
  } catch (e) {
    return invalid(
      e instanceof SpecError
        ? e.message
        : `invalid ${kind}: ${(e as Error).message}`,
    );
  }

  const id = slugify(input.name);
  // Namespaces are required and never empty — an empty namespace would cascade
  // to any SDK/schema derived from this entry.
  const namespace = (input.ns ?? "").trim();
  if (!namespace) return invalid("namespace is required.");
  const source = input.source ?? input.url ?? "upload";

  // Entry ids are globally unique across kinds. Refuse to let a schema/api of
  // the same name silently take over (and flip the kind of) an existing entry.
  const existing = await q.getApi(pool, { id });
  if (existing && existing.kind !== kind) {
    return invalid(
      `"${input.name}" maps to id "${id}", already registered as kind "${existing.kind}". Registry ids are unique across kinds — choose a different name.`,
    );
  }

  await q.upsertApi(pool, {
    id,
    name: input.name,
    description: "",
    format: ing.format,
    namespace,
    source,
    kind,
  });

  const key =
    kind === "schema"
      ? `schemas/${id}/${ing.version}/schema.${ing.ext}`
      : `specs/${id}/${ing.version}/openapi.${ing.ext}`;
  await storage.write(key, text, { mimeType: ing.contentType });

  await q.clearCurrentVersions(pool, { apiId: id });
  await q.upsertVersion(pool, {
    apiId: id,
    version: ing.version,
    specObjectKey: key,
    specUrl: `${namespace}/${id}@${ing.version}`,
    contentType: ing.contentType,
    specSha: sha256(text),
    title: ing.title,
    opCount: ing.opCount,
    isCurrent: true,
  });
  // `latest` always tracks the newest registered version.
  await q.upsertDistTag(pool, {
    apiId: id,
    tag: "latest",
    version: ing.version,
  });

  const a = await q.getApi(pool, { id });
  const [versions, distTags] = await Promise.all([
    q.listVersions(pool, { apiId: id }),
    q.listDistTags(pool, { apiId: id }),
  ]);
  return toRegistryEntryCore(a as q.GetApiRow, versions, distTags);
};
