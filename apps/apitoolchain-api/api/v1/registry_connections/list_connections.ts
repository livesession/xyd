import { pool } from "../../../dbnode/pool";
import * as regQ from "../../../dbnode/registries";
import type { RegistryConnections } from "../../openapi/v1/src/generated/models/all/platform-api";
import { toRegistryConnection } from "../__kit/mappers";

/** GET /registry-connections?targetId — all, or scoped to one SDK target. */
export const list: RegistryConnections["list"] = async (_ctx, options) => {
  const rows = options?.targetId
    ? await regQ.listRegistryConnectionsByTarget(pool, {
        targetId: options.targetId,
      })
    : await regQ.listRegistryConnections(pool);
  return rows.map(toRegistryConnection);
};
