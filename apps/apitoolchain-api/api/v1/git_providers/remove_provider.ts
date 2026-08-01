import * as gitQ from "../../../dbnode/git";
import { pool } from "../../../dbnode/pool";
import type { GitProviders } from "../../openapi/v1/src/generated/models/all/platform-api";
import { notFound } from "../__kit/errors";

/** DELETE /git-providers/{id} — cascades to its repo connections. */
export const remove: GitProviders["remove"] = async (_ctx, id) => {
  const p = await gitQ.getGitProvider(pool, { id });
  if (!p) return notFound(`git provider ${id} not found`);
  await gitQ.deleteGitProvider(pool, { id });
};
