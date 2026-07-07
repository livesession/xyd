import type { RegistryConnections } from "../../../generated/src/generated/models/all/platform-api";
import { requireAuth } from "../../auth";
import * as regQ from "../../db/generated/registries_sql";
import { pool } from "../../db/pool";
import { enqueuePublish } from "../../gen/publish";
import { toRegistryConnection } from "../../mappers";
import { notFound } from "../errors";

/**
 * POST /registry-connections/{id}/publish — publish the target's current build
 * to the registry. Inserts a `sdk.publish` job + marks the connection
 * publishing, kicks the (off-request) publish, and returns the connection in its
 * `building` state.
 */
export const publish: RegistryConnections["publish"] = async (ctx, id) => {
  const auth = await requireAuth(ctx);
  const conn = await regQ.getRegistryConnection(pool, { id });
  if (!conn) return notFound(`registry connection ${id} not found`);
  await enqueuePublish({ connectionId: id, projectId: auth.projectId });
  const fresh = await regQ.getRegistryConnection(pool, { id });
  return toRegistryConnection(fresh as NonNullable<typeof fresh>);
};
