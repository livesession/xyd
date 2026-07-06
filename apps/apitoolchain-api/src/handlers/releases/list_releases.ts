import type { Releases } from "../../../generated/src/generated/models/all/platform-api";
import * as releaseQ from "../../db/generated/releases_sql";
import { pool } from "../../db/pool";
import { toRelease } from "../../mappers";

export const list: Releases["list"] = async (_ctx, options) => {
  const rows = options?.connectionId
    ? await releaseQ.listReleasesByConnection(pool, {
        connectionId: options.connectionId,
      })
    : await releaseQ.listReleases(pool);
  return rows.map(toRelease);
};
