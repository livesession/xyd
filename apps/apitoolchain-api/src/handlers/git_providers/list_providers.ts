import type { GitProviders } from "../../../generated/src/generated/models/all/platform-api";
import * as gitQ from "../../db/generated/git_sql";
import { pool } from "../../db/pool";
import { toGitProvider } from "../../mappers";

/** GET /git-providers — connected accounts (tokens never leave the server). */
export const list: GitProviders["list"] = async () =>
  (await gitQ.listGitProviders(pool)).map(toGitProvider);
