import type { SdkTargets } from "../../../generated/src/generated/models/all/platform-api";
import { createSdkTarget } from "./create_sdk_target";
import { listSdkTargets } from "./list_sdk_targets";

/** `/sdk-targets` — list + create (wired opensdk generation). */
export const sdkTargets: SdkTargets = {
  list: listSdkTargets,
  create: createSdkTarget,
};
