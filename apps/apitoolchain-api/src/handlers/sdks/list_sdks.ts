import type { Sdks } from "../../../generated/src/generated/models/all/platform-api";
import * as sdksQ from "../../db/generated/sdks_sql";
import { pool } from "../../db/pool";
import { toSdk } from "../../mappers";

/** GET /sdks(?apiId=) — every SDK, with its target count folded in. */
export const listSdks: Sdks["list"] = async (_ctx, options) => {
  const rows = options?.apiId
    ? await sdksQ.listSdksByApi(pool, { apiId: options.apiId })
    : await sdksQ.listSdks(pool);
  const counts = new Map(
    (await sdksQ.sdkTargetCountsBySdk(pool)).map((c) => [c.sdkId, c.n]),
  );
  return rows.map((r) => toSdk(r, counts.get(r.id) ?? 0));
};
