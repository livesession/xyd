import { gitProviderClient } from "../../../clients/gitprovider";
import * as gitQ from "../../../dbnode/git";
import { pool } from "../../../dbnode/pool";
import type { GitProviders } from "../../openapi/v1/src/generated/models/all/platform-api";
import { invalid, notFound } from "../__kit/errors";

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
