import { gitProviderClient } from "../../../clients/gitprovider";
import * as gitQ from "../../../dbnode/git";
import { pool } from "../../../dbnode/pool";
import * as releaseQ from "../../../dbnode/releases";
import { runPublishRelease } from "../../../genframework/release";
import type { Releases } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { invalid, notFound } from "../__kit/errors";
import { toRelease } from "../__kit/mappers";

/**
 * POST /releases/{id}/publish — the manual fallback for merge detection (when a
 * webhook can't reach the gateway). Verifies the PR is actually merged via
 * gitproviderd, then kicks the (off-request) tag + Release.
 */
export const publish: Releases["publish"] = async (ctx, id) => {
  const auth = await requireAuth(ctx);
  const release = await releaseQ.getRelease(pool, { id });
  if (!release) return notFound(`release ${id} not found`);
  if (release.state !== "pr_open")
    return invalid(`release is ${release.state}, not an open PR`);
  const conn = await gitQ.getRepoConnection(pool, { id: release.connectionId });
  if (!conn) return notFound("connection not found");
  const provider = await gitQ.getGitProvider(pool, { id: conn.providerId });
  if (!provider) return notFound("git provider not found");

  const status = await gitProviderClient.prStatus({
    kind: provider.kind,
    baseUrl: provider.baseUrl,
    token: provider.token,
    login: provider.connectedAs,
    repo: conn.repo,
    number: release.prNumber,
  });
  if (!status.merged) return invalid("the release PR has not been merged yet");

  void runPublishRelease({ releaseId: id, projectId: auth.projectId });
  const fresh = await releaseQ.getRelease(pool, { id });
  return toRelease(fresh as NonNullable<typeof fresh>);
};
