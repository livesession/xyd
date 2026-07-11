import { pool } from "../../../dbnode/pool";
import * as sdkQ from "../../../dbnode/sdk_targets";
import type { SdkTargets } from "../../openapi/v1/src/generated/models/all/platform-api";
import { notFound } from "../__kit/errors";
import { toSdkTarget } from "../__kit/mappers";

/** GET /sdk-targets/{id} — one target (for the SDK detail view), or 404. */
export const getSdkTarget: SdkTargets["read"] = async (_ctx, id) => {
  const row = await sdkQ.getSdkTarget(pool, { id });
  if (!row) return notFound(`sdk target ${id} not found`);
  return toSdkTarget(row);
};
