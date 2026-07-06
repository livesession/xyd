import type { RepoConnections } from "../../../generated/src/generated/models/all/platform-api";
import { requireAuth } from "../../auth";
import { gitProviderClient } from "../../clients/gitprovider";
import * as gitQ from "../../db/generated/git_sql";
import { pool } from "../../db/pool";
import { prepareReleaseForConnection } from "../../gen/release";
import { toRepoConnection } from "../../mappers";
import { applyReleaseConfig } from "../../release_config";
import { randomId } from "../../util";
import { invalid, notFound } from "../errors";

/**
 * POST /repo-connections — link a spec/SDK target to a repo. `repo` is either an
 * existing "owner/name" or, when `createRepo` is set, a new repo name that we
 * create under the account first (idempotent) and store by its full name.
 */
export const create: RepoConnections["create"] = async (ctx, input) => {
  const auth = await requireAuth(ctx);
  const provider = await gitQ.getGitProvider(pool, { id: input.providerId });
  if (!provider) return notFound(`git provider ${input.providerId} not found`);
  let repo = (input.repo ?? "").trim();
  if (!repo) return invalid("a repo is required");
  let branch = (input.branch ?? "").trim();

  if (input.createRepo) {
    try {
      const created = await gitProviderClient.createRepo({
        kind: provider.kind,
        baseUrl: provider.baseUrl,
        token: provider.token,
        login: provider.connectedAs,
        name: repo,
        private: input.makePrivate ?? false,
        defaultBranch: branch || undefined,
      });
      repo = created.fullName;
      // Store the branch the repo actually got (some providers ignore the
      // requested one on create), so sync always resolves an existing branch.
      branch = created.defaultBranch || branch;
    } catch (e) {
      return invalid(`could not create repo: ${(e as Error).message}`);
    }
  }

  // Prefix defaults to empty (repo root); branch "" → resolved to the repo
  // default at sync time.
  const prefix = input.prefix ?? "";
  const row = await gitQ.insertRepoConnection(pool, {
    id: randomId("rc"),
    providerId: input.providerId,
    targetKind: input.targetKind,
    targetId: input.targetId,
    ref: input.ref ?? "",
    repo,
    branch,
    prefix,
  });
  const created = row as NonNullable<typeof row>;

  // Optional default release mode picked in the connect modal (defaults to the
  // legacy direct-push mode). Applying `release` also registers the webhook.
  if (input.releaseMode) {
    const updated = await applyReleaseConfig(created.id, provider, {
      releaseMode: input.releaseMode,
      autoRelease: input.autoRelease ?? false,
      baseBranch: input.baseBranch,
    });
    // Auto-release → open the initial PR from the current spec right away.
    if (input.releaseMode === "release" && input.autoRelease) {
      void prepareReleaseForConnection({
        connectionId: created.id,
        projectId: auth.projectId,
      });
    }
    return toRepoConnection(
      (updated ?? created) as NonNullable<typeof updated>,
    );
  }
  return toRepoConnection(created);
};
