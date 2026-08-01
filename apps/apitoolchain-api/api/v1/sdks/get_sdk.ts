import { pool } from "../../../dbnode/pool";
import * as sdkQ from "../../../dbnode/sdk_targets";
import * as sdksQ from "../../../dbnode/sdks";
import type { Sdks } from "../../openapi/v1/src/generated/models/all/platform-api";
import { notFound } from "../__kit/errors";
import { toSdk } from "../__kit/mappers";

/** GET /sdks/{id} — one SDK (with live target count), or 404. */
export const getSdk: Sdks["read"] = async (_ctx, id) => {
  const row = await sdksQ.getSdk(pool, { id });
  if (!row) return notFound(`sdk ${id} not found`);
  const targets = await sdkQ.listSdkTargetsBySdk(pool, { sdkId: id });
  return toSdk(row, targets.length);
};
