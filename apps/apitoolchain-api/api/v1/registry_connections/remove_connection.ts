import { pool } from "../../../dbnode/pool";
import * as regQ from "../../../dbnode/registries";
import type { RegistryConnections } from "../../openapi/v1/src/generated/models/all/platform-api";
import { notFound } from "../__kit/errors";

/** DELETE /registry-connections/{id}. */
export const remove: RegistryConnections["remove"] = async (_ctx, id) => {
  const conn = await regQ.getRegistryConnection(pool, { id });
  if (!conn) return notFound(`registry connection ${id} not found`);
  await regQ.deleteRegistryConnection(pool, { id });
};
