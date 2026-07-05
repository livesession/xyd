import type { SdkTargets } from "../../../generated/src/generated/models/all/platform-api";
import * as sdkQ from "../../db/generated/sdk_targets_sql";
import { pool } from "../../db/pool";
import { toSdkTarget } from "../../mappers";
import { notFound } from "../errors";

/** GET /sdk-targets/{id} — one target (for the SDK detail view), or 404. */
export const getSdkTarget: SdkTargets["read"] = async (_ctx, id) => {
  const row = await sdkQ.getSdkTarget(pool, { id });
  if (!row) return notFound(`sdk target ${id} not found`);
  return toSdkTarget(row);
};
