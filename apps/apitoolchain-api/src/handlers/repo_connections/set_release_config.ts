import type { RepoConnections } from "../../../generated/src/generated/models/all/platform-api";
import { requireAuth } from "../../auth";
import * as gitQ from "../../db/generated/git_sql";
import { pool } from "../../db/pool";
import { prepareReleaseForConnection } from "../../gen/release";
import { toRepoConnection } from "../../mappers";
import { applyReleaseConfig } from "../../release_config";
import { notFound } from "../errors";

/**
 * POST /repo-connections/{id}/release-config — switch a connection between
 * direct-push and PR-based release mode (+ auto-release / base branch /
 * prerelease). Enabling release mode registers a merge webhook when a public
 * gateway URL is configured (see applyReleaseConfig); enabling auto-release
 * also opens the initial PR from the current spec straight away.
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
  });
  if (input.releaseMode === "release" && input.autoRelease) {
    void prepareReleaseForConnection({
      connectionId: id,
      projectId: auth.projectId,
    });
  }
  return toRepoConnection((updated ?? conn) as NonNullable<typeof updated>);
};
