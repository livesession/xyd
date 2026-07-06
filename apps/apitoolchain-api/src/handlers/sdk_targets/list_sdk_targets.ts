import type { SdkTargets } from "../../../generated/src/generated/models/all/platform-api";
import { requireAuth } from "../../auth";
import * as sdkQ from "../../db/generated/sdk_targets_sql";
import { pool } from "../../db/pool";
import { toSdkTarget } from "../../mappers";

/** GET /sdk-targets(?apiId=) — scoped to the current project. */
export const listSdkTargets: SdkTargets["list"] = async (ctx, options) => {
  const auth = await requireAuth(ctx);
  const rows = options?.apiId
    ? await sdkQ.listSdkTargetsByApi(pool, { apiId: options.apiId })
    : await sdkQ.listSdkTargets(pool, { projectId: auth.projectId });
  return rows.map(toSdkTarget);
};
