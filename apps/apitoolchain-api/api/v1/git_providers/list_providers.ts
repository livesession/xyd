import * as gitQ from "../../../dbnode/git";
import { pool } from "../../../dbnode/pool";
import type { GitProviders } from "../../openapi/v1/src/generated/models/all/platform-api";
import { toGitProvider } from "../__kit/mappers";

/** GET /git-providers — connected accounts (tokens never leave the server). */
export const list: GitProviders["list"] = async () =>
  (await gitQ.listGitProviders(pool)).map(toGitProvider);
