import type { Sdks } from "../../../generated/src/generated/models/all/platform-api";
import { addTarget } from "./add_target";
import { createSdk } from "./create_sdk";
import { getSdk } from "./get_sdk";
import { listSdks } from "./list_sdks";
import { listTargets } from "./list_targets";
import { removeSdk } from "./remove_sdk";

/** `/sdks` — named SDK projects (grouping per-language targets) for an API. */
export const sdks: Sdks = {
  list: listSdks,
  read: getSdk,
  create: createSdk,
  remove: removeSdk,
  listTargets,
  addTarget,
};
