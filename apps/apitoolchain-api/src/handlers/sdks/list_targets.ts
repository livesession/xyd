import type { Sdks } from "../../../generated/src/generated/models/all/platform-api";
import * as sdkQ from "../../db/generated/sdk_targets_sql";
import * as sdksQ from "../../db/generated/sdks_sql";
import { pool } from "../../db/pool";
import { toSdkTarget } from "../../mappers";
import { notFound } from "../errors";

/** GET /sdks/{sdkId}/targets — the SDK's per-language targets. */
export const listTargets: Sdks["listTargets"] = async (_ctx, sdkId) => {
  const sdk = await sdksQ.getSdk(pool, { id: sdkId });
  if (!sdk) return notFound(`sdk ${sdkId} not found`);
  const rows = await sdkQ.listSdkTargetsBySdk(pool, { sdkId });
  return rows.map(toSdkTarget);
};
