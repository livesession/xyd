import { pool } from "../../../dbnode/pool";
import * as sdkQ from "../../../dbnode/sdk_targets";
import * as sdksQ from "../../../dbnode/sdks";
import type { Sdks } from "../../openapi/v1/src/generated/models/all/platform-api";
import { notFound } from "../__kit/errors";
import { toSdkTarget } from "../__kit/mappers";

/** GET /sdks/{sdkId}/targets — the SDK's per-language targets. */
export const listTargets: Sdks["listTargets"] = async (_ctx, sdkId) => {
  const sdk = await sdksQ.getSdk(pool, { id: sdkId });
  if (!sdk) return notFound(`sdk ${sdkId} not found`);
  const rows = await sdkQ.listSdkTargetsBySdk(pool, { sdkId });
  return rows.map(toSdkTarget);
};
