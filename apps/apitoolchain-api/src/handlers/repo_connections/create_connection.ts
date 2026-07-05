import type { RepoConnections } from "../../../generated/src/generated/models/all/platform-api";
import { gitProviderClient } from "../../clients/gitprovider";
import * as gitQ from "../../db/generated/git_sql";
import { pool } from "../../db/pool";
import { toRepoConnection } from "../../mappers";
import { randomId } from "../../util";
import { invalid, notFound } from "../errors";

/**
 * POST /repo-connections — link a spec/SDK target to a repo. `repo` is either an
 * existing "owner/name" or, when `createRepo` is set, a new repo name that we
 * create under the account first (idempotent) and store by its full name.
 */
export const create: RepoConnections["create"] = async (_ctx, input) => {
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
  return toRepoConnection(row as NonNullable<typeof row>);
};
