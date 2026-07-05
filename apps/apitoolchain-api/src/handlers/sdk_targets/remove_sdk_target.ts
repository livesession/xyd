import type { SdkTargets } from "../../../generated/src/generated/models/all/platform-api";
import * as sdkQ from "../../db/generated/sdk_targets_sql";
import { pool } from "../../db/pool";
import { notFound } from "../errors";

/** DELETE /sdk-targets/{id} — remove a target (from the SDK detail danger zone). */
export const removeSdkTarget: SdkTargets["remove"] = async (_ctx, id) => {
  const row = await sdkQ.getSdkTarget(pool, { id });
  if (!row) return notFound(`sdk target ${id} not found`);
  await sdkQ.deleteSdkTarget(pool, { id });
};
