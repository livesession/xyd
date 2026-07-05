import type { GitProviders } from "../../../generated/src/generated/models/all/platform-api";
import * as gitQ from "../../db/generated/git_sql";
import { pool } from "../../db/pool";
import { notFound } from "../errors";

/** DELETE /git-providers/{id} — cascades to its repo connections. */
export const remove: GitProviders["remove"] = async (_ctx, id) => {
  const p = await gitQ.getGitProvider(pool, { id });
  if (!p) return notFound(`git provider ${id} not found`);
  await gitQ.deleteGitProvider(pool, { id });
};
