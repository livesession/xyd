import type { Apis } from "../../../generated/src/generated/models/all/registry-api";
import * as q from "../../db/generated/registry_sql";
import { pool } from "../../db/pool";
import { toRegistryEntryCore } from "../../mappers";
import { notFound } from "../errors";

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
