import * as gitQ from "../../../dbnode/git";
import { pool } from "../../../dbnode/pool";
import type { RepoConnections } from "../../openapi/v1/src/generated/models/all/platform-api";
import { notFound } from "../__kit/errors";

/** DELETE /repo-connections/{id}. */
export const remove: RepoConnections["remove"] = async (_ctx, id) => {
  const conn = await gitQ.getRepoConnection(pool, { id });
  if (!conn) return notFound(`connection ${id} not found`);
  await gitQ.deleteRepoConnection(pool, { id });
};
