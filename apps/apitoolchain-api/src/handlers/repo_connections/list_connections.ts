import type { RepoConnections } from "../../../generated/src/generated/models/all/platform-api";
import * as gitQ from "../../db/generated/git_sql";
import { pool } from "../../db/pool";
import { toRepoConnection } from "../../mappers";

/** GET /repo-connections?targetKind&targetId — all, or scoped to one entity. */
export const list: RepoConnections["list"] = async (_ctx, options) => {
  const rows =
    options?.targetKind && options?.targetId
      ? await gitQ.listRepoConnectionsByTarget(pool, {
          targetKind: options.targetKind,
          targetId: options.targetId,
        })
      : await gitQ.listRepoConnections(pool);
  return rows.map(toRepoConnection);
};
