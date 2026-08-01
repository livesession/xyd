import { pool } from "../../../dbnode/pool";
import * as q from "../../../dbnode/registry";
import type { Apis } from "../../openapi/v1/src/generated/models/all/registry-api";
import { notFound } from "../__kit/errors";
import { toRegistryEntryCore } from "../__kit/mappers";

/** GET /apis/{apiId} — one API or 404. */
export const getApi: Apis["read"] = async (_ctx, apiId) => {
  const a = await q.getApi(pool, { id: apiId });
  if (!a) return notFound(`api ${apiId} not found`);
  const [versions, distTags] = await Promise.all([
    q.listVersions(pool, { apiId }),
    q.listDistTags(pool, { apiId }),
  ]);
  return toRegistryEntryCore(a, versions, distTags);
};
