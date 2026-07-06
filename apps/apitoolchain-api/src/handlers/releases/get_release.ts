import type { Releases } from "../../../generated/src/generated/models/all/platform-api";
import * as releaseQ from "../../db/generated/releases_sql";
import { pool } from "../../db/pool";
import { toRelease } from "../../mappers";
import { notFound } from "../errors";

export const read: Releases["read"] = async (_ctx, id) => {
  const row = await releaseQ.getRelease(pool, { id });
  if (!row) return notFound(`release ${id} not found`);
  return toRelease(row);
};
