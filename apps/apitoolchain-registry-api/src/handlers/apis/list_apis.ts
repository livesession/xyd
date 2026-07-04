import type { RegistryEntryCore } from "../../../generated/src/generated/models/all/apitoolchain";
import type { Apis } from "../../../generated/src/generated/models/all/registry-api";
import * as q from "../../db/generated/registry_sql";
import { pool } from "../../db/pool";
import { toRegistryEntryCore } from "../../mappers";

/** GET /apis — every registered API (core shape, no platform rollups). */
export const listApis: Apis["list"] = async () => {
  const apis = await q.listApis(pool);
  const out: RegistryEntryCore[] = [];
  for (const a of apis) {
    const [versions, distTags] = await Promise.all([
      q.listVersions(pool, { apiId: a.id }),
      q.listDistTags(pool, { apiId: a.id }),
    ]);
    out.push(toRegistryEntryCore(a, versions, distTags));
  }
  return out;
};
