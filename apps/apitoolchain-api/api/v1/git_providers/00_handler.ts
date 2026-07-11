import type { GitProviders } from "../../openapi/v1/src/generated/models/all/platform-api";
import { create } from "./create_provider";
import { listBranches } from "./list_branches";
import { list } from "./list_providers";
import { listRepos } from "./list_repos";
import { remove } from "./remove_provider";

export const gitProviders: GitProviders = {
  list,
  create,
  remove,
  listRepos,
  listBranches,
};
