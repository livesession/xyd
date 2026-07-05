import type { GitProviders } from "../../../generated/src/generated/models/all/platform-api";
import { gitProviderClient } from "../../clients/gitprovider";
import * as gitQ from "../../db/generated/git_sql";
import { pool } from "../../db/pool";
import { invalid, notFound } from "../errors";

/** GET /git-providers/{id}/repos — repos the token can access (connect picker). */
export const listRepos: GitProviders["listRepos"] = async (_ctx, id) => {
  const p = await gitQ.getGitProvider(pool, { id });
  if (!p) return notFound(`git provider ${id} not found`);
  try {
    const repos = await gitProviderClient.listRepos({
      kind: p.kind,
      baseUrl: p.baseUrl,
      token: p.token,
      login: p.connectedAs,
    });
    return repos.map((r) => ({
      fullName: r.fullName,
      defaultBranch: r.defaultBranch,
      htmlUrl: r.htmlUrl,
      // `_private` is the generated field name (serialises to wire `private`).
      _private: r.private,
    }));
  } catch (e) {
    return invalid(`could not list repos: ${(e as Error).message}`);
  }
};
