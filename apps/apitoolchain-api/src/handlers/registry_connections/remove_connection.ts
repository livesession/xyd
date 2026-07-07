import type { RegistryConnections } from "../../../generated/src/generated/models/all/platform-api";
import * as regQ from "../../db/generated/registries_sql";
import { pool } from "../../db/pool";
import { notFound } from "../errors";

/** DELETE /registry-connections/{id}. */
export const remove: RegistryConnections["remove"] = async (_ctx, id) => {
  const conn = await regQ.getRegistryConnection(pool, { id });
  if (!conn) return notFound(`registry connection ${id} not found`);
  await regQ.deleteRegistryConnection(pool, { id });
};
