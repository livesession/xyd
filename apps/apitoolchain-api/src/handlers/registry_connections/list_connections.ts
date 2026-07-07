import type { RegistryConnections } from "../../../generated/src/generated/models/all/platform-api";
import * as regQ from "../../db/generated/registries_sql";
import { pool } from "../../db/pool";
import { toRegistryConnection } from "../../mappers";

/** GET /registry-connections?targetId — all, or scoped to one SDK target. */
export const list: RegistryConnections["list"] = async (_ctx, options) => {
  const rows = options?.targetId
    ? await regQ.listRegistryConnectionsByTarget(pool, {
        targetId: options.targetId,
      })
    : await regQ.listRegistryConnections(pool);
  return rows.map(toRegistryConnection);
};
