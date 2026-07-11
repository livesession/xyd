import { pool } from "../../../dbnode/pool";
import * as q from "../../../dbnode/registry";
import type { Apis } from "../../openapi/v1/src/generated/models/all/registry-api";
import { invalid, notFound } from "../__kit/errors";
import { toRegistryEntryCore } from "../__kit/mappers";

/**
 * PATCH /apis/{apiId} — rename an entry (display name + description). The id,
 * namespace, format, and kind are IMMUTABLE (baked into URLs + the
 * `apis/<ns>/<api>@<ver>` registry refs + already-generated SDKs), so only
 * presentation metadata changes. Partial: omitted fields keep their value.
 */
export const updateApi: Apis["update"] = async (_ctx, apiId, input) => {
  const a = await q.getApi(pool, { id: apiId });
  if (!a) return notFound(`api ${apiId} not found`);
  const name = (input.name ?? a.name).trim();
  if (!name) return invalid("name is required.");
  const description = input.description ?? a.description;
  const updated = await q.updateApi(pool, { id: apiId, name, description });
  const [versions, distTags] = await Promise.all([
    q.listVersions(pool, { apiId }),
    q.listDistTags(pool, { apiId }),
  ]);
  return toRegistryEntryCore(
    updated as NonNullable<typeof updated>,
    versions,
    distTags,
  );
};
