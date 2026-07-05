import type { GitProviders } from "../../../generated/src/generated/models/all/platform-api";
import { gitProviderClient } from "../../clients/gitprovider";
import * as gitQ from "../../db/generated/git_sql";
import { pool } from "../../db/pool";
import { invalid, notFound } from "../errors";

/** GET /git-providers/{id}/branches?repo= — branch names for the branch picker. */
export const listBranches: GitProviders["listBranches"] = async (
  _ctx,
  id,
  repo,
) => {
  const p = await gitQ.getGitProvider(pool, { id });
  if (!p) return notFound(`git provider ${id} not found`);
  if (!repo) return invalid("repo is required");
  try {
    return await gitProviderClient.listBranches({
      kind: p.kind,
      baseUrl: p.baseUrl,
      token: p.token,
      login: p.connectedAs,
      repo,
    });
  } catch (e) {
    return invalid(`could not list branches: ${(e as Error).message}`);
  }
};
