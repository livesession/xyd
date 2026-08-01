import * as gitQ from "../../../dbnode/git";
import { pool } from "../../../dbnode/pool";
import type { RepoConnections } from "../../openapi/v1/src/generated/models/all/platform-api";
import { toRepoConnection } from "../__kit/mappers";

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
