import { pool } from "../../../dbnode/pool";
import * as q from "../../../dbnode/registry";
import { storage } from "../../../storage";
import type { Apis } from "../../openapi/v1/src/generated/models/all/registry-api";
import { notFound } from "../__kit/errors";

/** Resolve a version ref: `current` | a dist-tag (incl. `latest`, which shadows
 * a same-named version) | a concrete version. */
async function resolveVersion(
  apiId: string,
  ref: string,
): Promise<Awaited<ReturnType<typeof q.getVersion>>> {
  if (ref === "current") return q.getCurrentVersion(pool, { apiId });
  const tag = await q.getDistTag(pool, { apiId, tag: ref });
  if (tag) return q.getVersion(pool, { apiId, version: tag.version });
  return q.getVersion(pool, { apiId, version: ref });
}

/**
 * GET /apis/{apiId}/versions/{ref}/spec — the RAW spec bytes (yaml/json), served
 * as-stored so the SDK generator keeps `$ref` fidelity. A non-JSON body (`*​/​*`),
 * so the generated SDK returns the raw Response and the platform-api streams it
 * on — no JSON round-trip that would rewrite the doc.
 */
export const spec: Apis["spec"] = async (_ctx, apiId, ref) => {
  const row = await resolveVersion(apiId, ref);
  if (!row) return notFound(`spec ${apiId}@${ref} not found`);
  const text = await storage.readToString(row.specObjectKey);
  return { contentType: row.contentType, spec: new TextEncoder().encode(text) };
};
