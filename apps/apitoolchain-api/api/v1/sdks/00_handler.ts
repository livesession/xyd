import type { Sdks } from "../../openapi/v1/src/generated/models/all/platform-api";
import { addTarget } from "./add_target";
import { buildSdk } from "./build_sdk";
import { createSdk } from "./create_sdk";
import { createVersion } from "./create_version";
import { getSdk } from "./get_sdk";
import { listSdks } from "./list_sdks";
import { listTargets } from "./list_targets";
import { listVersions } from "./list_versions";
import { removeSdk } from "./remove_sdk";

/** `/sdks` — named SDK projects (grouping per-language targets) for an API. */
export const sdks: Sdks = {
  list: listSdks,
  read: getSdk,
  create: createSdk,
  remove: removeSdk,
  listTargets,
  addTarget,
  build: buildSdk,
  listVersions,
  createVersion,
};
