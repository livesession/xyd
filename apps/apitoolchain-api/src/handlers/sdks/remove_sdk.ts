import type { Sdks } from "../../../generated/src/generated/models/all/platform-api";
import * as sdksQ from "../../db/generated/sdks_sql";
import { pool } from "../../db/pool";
import { notFound } from "../errors";

/** DELETE /sdks/{id} — remove an SDK and all its targets. */
export const removeSdk: Sdks["remove"] = async (_ctx, id) => {
  const row = await sdksQ.getSdk(pool, { id });
  if (!row) return notFound(`sdk ${id} not found`);
  await sdksQ.deleteSdkTargetsBySdk(pool, { sdkId: id });
  await sdksQ.deleteSdk(pool, { id });
};
