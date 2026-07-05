import type { RepoConnections } from "../../../generated/src/generated/models/all/platform-api";
import * as gitQ from "../../db/generated/git_sql";
import * as jobQ from "../../db/generated/jobs_sql";
import { pool } from "../../db/pool";
import { runGitSync } from "../../gen/sync";
import { toRepoConnection } from "../../mappers";
import { randomId } from "../../util";
import { notFound } from "../errors";

/**
 * POST /repo-connections/{id}/sync — push the spec/SDK into the repo. Inserts a
 * `git.sync` job + marks the connection syncing, kicks the (off-request) push,
 * and returns the connection in its `building` state.
 */
export const sync: RepoConnections["sync"] = async (_ctx, id) => {
  const conn = await gitQ.getRepoConnection(pool, { id });
  if (!conn) return notFound(`connection ${id} not found`);
  const job = await jobQ.insertJob(pool, {
    id: randomId("job"),
    kind: "git.sync",
    targetRef: id,
    status: "running",
    payload: {
      repo: conn.repo,
      targetKind: conn.targetKind,
      targetId: conn.targetId,
    },
  });
  await gitQ.markRepoConnectionSyncing(pool, { id });
  void runGitSync({ connectionId: id, jobId: job?.id ?? "" });
  const fresh = await gitQ.getRepoConnection(pool, { id });
  return toRepoConnection(fresh as NonNullable<typeof fresh>);
};
