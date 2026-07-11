import { pool } from "../../../dbnode/pool";
import * as regQ from "../../../dbnode/registries";
import { enqueuePublish } from "../../../genframework/publish";
import type { RegistryConnections } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { notFound } from "../__kit/errors";
import { toRegistryConnection } from "../__kit/mappers";

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
