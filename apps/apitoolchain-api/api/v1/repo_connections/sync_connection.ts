import * as gitQ from "../../../dbnode/git";
import * as jobQ from "../../../dbnode/jobs";
import { pool } from "../../../dbnode/pool";
import { runGitSync } from "../../../genframework/sync";
import { randomId } from "../../../util";
import type { RepoConnections } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { notFound } from "../__kit/errors";
import { toRepoConnection } from "../__kit/mappers";

/**
 * POST /repo-connections/{id}/sync — push the spec/SDK into the repo. Inserts a
 * `git.sync` job + marks the connection syncing, kicks the (off-request) push,
 * and returns the connection in its `building` state.
 */
export const sync: RepoConnections["sync"] = async (ctx, id) => {
  const auth = await requireAuth(ctx);
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
  void runGitSync({
    connectionId: id,
    jobId: job?.id ?? "",
    projectId: auth.projectId,
  });
  const fresh = await gitQ.getRepoConnection(pool, { id });
  return toRepoConnection(fresh as NonNullable<typeof fresh>);
};
