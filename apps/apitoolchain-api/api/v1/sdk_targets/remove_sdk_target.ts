import { pool } from "../../../dbnode/pool";
import * as sdkQ from "../../../dbnode/sdk_targets";
import type { SdkTargets } from "../../openapi/v1/src/generated/models/all/platform-api";
import { notFound } from "../__kit/errors";

/** DELETE /sdk-targets/{id} — remove a target (from the SDK detail danger zone). */
export const removeSdkTarget: SdkTargets["remove"] = async (_ctx, id) => {
  const row = await sdkQ.getSdkTarget(pool, { id });
  if (!row) return notFound(`sdk target ${id} not found`);
  await sdkQ.deleteSdkTarget(pool, { id });
};
