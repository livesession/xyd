import type { Apis } from "../../../generated/src/generated/models/all/registry-api";
import * as q from "../../db/generated/registry_sql";
import { pool } from "../../db/pool";
import { toRegistryEntryCore } from "../../mappers";
import { invalid, notFound } from "../errors";

const TAG_RE = /^[a-z0-9][a-z0-9._-]*$/i;

/**
 * POST /apis/{apiId}/dist-tags — create or move a dist-tag to an existing
 * version. `latest` additionally syncs the version's `current` flag (so the SDK
 * generator's `current` ref and the `latest` tag never diverge).
 */
export const setDistTag: Apis["setDistTag"] = async (_ctx, apiId, input) => {
  const a = await q.getApi(pool, { id: apiId });
  if (!a) return notFound(`api ${apiId} not found`);

  const tag = input.tag.trim();
  if (!TAG_RE.test(tag)) return invalid(`invalid tag name: ${input.tag}`);

  const version = await q.getVersion(pool, { apiId, version: input.version });
  if (!version) return invalid(`version ${input.version} does not exist`);

  await q.upsertDistTag(pool, { apiId, tag, version: input.version });
  if (tag === "latest") {
    await q.setCurrentVersion(pool, { apiId, version: input.version });
  }

  const [versions, distTags] = await Promise.all([
    q.listVersions(pool, { apiId }),
    q.listDistTags(pool, { apiId }),
  ]);
  return toRegistryEntryCore(a, versions, distTags);
};
