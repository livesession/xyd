import { pool } from "../../../dbnode/pool";
import * as q from "../../../dbnode/registry";
import { ingestSpec, SpecError } from "../../../spec/ingest";
import { storage } from "../../../storage";
import { sha256, slugify } from "../../../util";
import type { Apis } from "../../openapi/v1/src/generated/models/all/registry-api";
import { invalid } from "../__kit/errors";
import { toRegistryEntryCore } from "../__kit/mappers";

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

  // The id may be set explicitly (decoupled from the display name), else derived
  // from the name. Either way it's slugified so it's URL/package-safe.
  const id = slugify(input.id || input.name);
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

  // Store the raw bytes FIRST — if object storage fails (e.g. a very large
  // spec), we don't want to leave an api/version row whose spec can't be
  // fetched, which would 404 every later spec fetch + SDK generation.
  const key =
    kind === "schema"
      ? `schemas/${id}/${ing.version}/schema.${ing.ext}`
      : `specs/${id}/${ing.version}/openapi.${ing.ext}`;
  try {
    await storage.write(key, text, { mimeType: ing.contentType });
  } catch (e) {
    return invalid(`could not store spec bytes: ${(e as Error).message}`);
  }

  await q.upsertApi(pool, {
    id,
    name: input.name,
    description: "",
    format: ing.format,
    namespace,
    source,
    kind,
    projectId: input.projectId ?? "prj_default",
  });

  // The dist-tag decides whether this version becomes the current/default.
  // `latest` (the default) makes it current AND moves the `latest` tag; any
  // other tag (`canary`, `beta`, …) is a side-channel — the version is added +
  // tagged WITHOUT disturbing the stable current/latest version. The sentinel
  // `none` adds the version with NO dist-tag at all. The very first version
  // always bootstraps current (there's nothing else to be default).
  const rawTag = (input.distTag ?? "").trim();
  const none = rawTag === "none";
  const tag = none ? "" : rawTag || "latest";
  const existingCurrent = await q.getCurrentVersion(pool, { apiId: id });
  // Untagged (`none`) versions only become current to bootstrap the very first
  // version — they never steal `current` from a tagged one.
  const makeCurrent = none
    ? !existingCurrent
    : tag === "latest" || !existingCurrent;

  if (makeCurrent) await q.clearCurrentVersions(pool, { apiId: id });
  await q.upsertVersion(pool, {
    apiId: id,
    version: ing.version,
    specObjectKey: key,
    specUrl: `${namespace}/${id}@${ing.version}`,
    contentType: ing.contentType,
    specSha: sha256(text),
    title: ing.title,
    opCount: ing.opCount,
    isCurrent: makeCurrent,
  });
  if (!none) {
    await q.upsertDistTag(pool, { apiId: id, tag, version: ing.version });
    // Keep a `latest` pointer even when the first version bootstraps under a
    // side-channel tag, so the registry always has a `latest`.
    if (makeCurrent && tag !== "latest") {
      await q.upsertDistTag(pool, {
        apiId: id,
        tag: "latest",
        version: ing.version,
      });
    }
  }

  const a = await q.getApi(pool, { id });
  const [versions, distTags] = await Promise.all([
    q.listVersions(pool, { apiId: id }),
    q.listDistTags(pool, { apiId: id }),
  ]);
  return toRegistryEntryCore(a as q.GetApiRow, versions, distTags);
};
