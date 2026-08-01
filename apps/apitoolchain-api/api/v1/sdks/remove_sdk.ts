import { pool } from "../../../dbnode/pool";
import * as buildQ from "../../../dbnode/sdk_builds";
import * as sdksQ from "../../../dbnode/sdks";
import type { Sdks } from "../../openapi/v1/src/generated/models/all/platform-api";
import { notFound } from "../__kit/errors";

/** DELETE /sdks/{id} — remove an SDK and all its targets + build history. */
export const removeSdk: Sdks["remove"] = async (_ctx, id) => {
  const row = await sdksQ.getSdk(pool, { id });
  if (!row) return notFound(`sdk ${id} not found`);
  await sdksQ.deleteSdkTargetsBySdk(pool, { sdkId: id });
  // Also drop the build history, else recreating a same-slug SDK inherits stale
  // versions (sdk_builds is keyed by sdk_id, which is the slugified id).
  await buildQ.deleteSdkBuildsBySdk(pool, { sdkId: id });
  await sdksQ.deleteSdk(pool, { id });
};
