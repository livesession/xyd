import type { SdkTargets } from "../../../generated/src/generated/models/all/platform-api";
import { getSdkTarget } from "./get_sdk_target";
import { listSdkTargets } from "./list_sdk_targets";
import { removeSdkTarget } from "./remove_sdk_target";

/** `/sdk-targets` — a target by id (list/get/delete). Targets are created under
 * an SDK via POST /sdks/{sdkId}/targets. */
export const sdkTargets: SdkTargets = {
  list: listSdkTargets,
  read: getSdkTarget,
  remove: removeSdkTarget,
};
