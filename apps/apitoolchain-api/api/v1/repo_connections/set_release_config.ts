import * as gitQ from "../../../dbnode/git";
import { pool } from "../../../dbnode/pool";
import {
  prepareDirectPushForConnection,
  prepareReleaseForConnection,
} from "../../../genframework/release";
import type { RepoConnections } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { notFound } from "../__kit/errors";
import { toRepoConnection } from "../__kit/mappers";
import { applyReleaseConfig } from "../__kit/release_config";

/**
 * POST /repo-connections/{id}/release-config — switch a connection between
 * direct-push and PR-based release mode (+ auto-sync / dist-tags / base branch /
 * prerelease). Enabling release mode registers a merge webhook when a public
 * gateway URL is configured (see applyReleaseConfig); enabling auto-sync also
 * runs the initial cycle from the current spec straight away (release opens the
 * PR, direct-push commits to the branch).
 */
export const setReleaseConfig: RepoConnections["setReleaseConfig"] = async (
  ctx,
  id,
  input,
) => {
  const auth = await requireAuth(ctx);
  const conn = await gitQ.getRepoConnection(pool, { id });
  if (!conn) return notFound(`connection ${id} not found`);
  const provider = await gitQ.getGitProvider(pool, { id: conn.providerId });
  if (!provider) return notFound("git provider not found");

  const updated = await applyReleaseConfig(id, provider, {
    releaseMode: input.releaseMode,
    autoRelease: input.autoRelease,
    baseBranch: input.baseBranch,
    prerelease: input.prerelease,
    distTags: input.distTags,
  });
  if (input.autoRelease) {
    if (input.releaseMode === "push") {
      void prepareDirectPushForConnection({
        connectionId: id,
        projectId: auth.projectId,
      });
    } else if (input.releaseMode === "release") {
      void prepareReleaseForConnection({
        connectionId: id,
        projectId: auth.projectId,
      });
    }
  }
  return toRepoConnection((updated ?? conn) as NonNullable<typeof updated>);
};
