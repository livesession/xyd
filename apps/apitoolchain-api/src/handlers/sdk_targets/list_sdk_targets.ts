import type { SdkTargets } from "../../../generated/src/generated/models/all/platform-api";
import * as sdkQ from "../../db/generated/sdk_targets_sql";
import { pool } from "../../db/pool";
import { toSdkTarget } from "../../mappers";

/** GET /sdk-targets(?apiId=) */
export const listSdkTargets: SdkTargets["list"] = async (_ctx, options) => {
  const rows = options?.apiId
    ? await sdkQ.listSdkTargetsByApi(pool, { apiId: options.apiId })
    : await sdkQ.listSdkTargets(pool);
  return rows.map(toSdkTarget);
};
