import { pool } from "../../../dbnode/pool";
import * as sdkQ from "../../../dbnode/sdk_targets";
import type { SdkTargets } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { toSdkTarget } from "../__kit/mappers";

/** GET /sdk-targets(?apiId=) — scoped to the current project. */
export const listSdkTargets: SdkTargets["list"] = async (ctx, options) => {
  const auth = await requireAuth(ctx);
  const rows = options?.apiId
    ? await sdkQ.listSdkTargetsByApi(pool, { apiId: options.apiId })
    : await sdkQ.listSdkTargets(pool, { projectId: auth.projectId });
  return rows.map(toSdkTarget);
};
