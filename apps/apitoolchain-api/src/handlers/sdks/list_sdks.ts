import type { Sdks } from "../../../generated/src/generated/models/all/platform-api";
import { requireAuth } from "../../auth";
import * as sdksQ from "../../db/generated/sdks_sql";
import { pool } from "../../db/pool";
import { toSdk } from "../../mappers";

/** GET /sdks(?apiId=) — the current project's SDKs, with target counts folded in. */
export const listSdks: Sdks["list"] = async (ctx, options) => {
  const auth = await requireAuth(ctx);
  const rows = options?.apiId
    ? await sdksQ.listSdksByApi(pool, { apiId: options.apiId })
    : await sdksQ.listSdks(pool, { projectId: auth.projectId });
  const counts = new Map(
    (await sdksQ.sdkTargetCountsBySdk(pool)).map((c) => [c.sdkId, c.n]),
  );
  return rows.map((r) => toSdk(r, counts.get(r.id) ?? 0));
};
