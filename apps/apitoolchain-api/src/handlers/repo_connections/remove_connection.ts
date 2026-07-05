import type { RepoConnections } from "../../../generated/src/generated/models/all/platform-api";
import * as gitQ from "../../db/generated/git_sql";
import { pool } from "../../db/pool";
import { notFound } from "../errors";

/** DELETE /repo-connections/{id}. */
export const remove: RepoConnections["remove"] = async (_ctx, id) => {
  const conn = await gitQ.getRepoConnection(pool, { id });
  if (!conn) return notFound(`connection ${id} not found`);
  await gitQ.deleteRepoConnection(pool, { id });
};
