import type { Sdks } from "../../../generated/src/generated/models/all/platform-api";
import * as sdkQ from "../../db/generated/sdk_targets_sql";
import * as sdksQ from "../../db/generated/sdks_sql";
import { pool } from "../../db/pool";
import { toSdk } from "../../mappers";
import { notFound } from "../errors";

/** GET /sdks/{id} — one SDK (with live target count), or 404. */
export const getSdk: Sdks["read"] = async (_ctx, id) => {
  const row = await sdksQ.getSdk(pool, { id });
  if (!row) return notFound(`sdk ${id} not found`);
  const targets = await sdkQ.listSdkTargetsBySdk(pool, { sdkId: id });
  return toSdk(row, targets.length);
};
