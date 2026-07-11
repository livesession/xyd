import { pool } from "../../../dbnode/pool";
import * as releaseQ from "../../../dbnode/releases";
import type { Releases } from "../../openapi/v1/src/generated/models/all/platform-api";
import { notFound } from "../__kit/errors";
import { toRelease } from "../__kit/mappers";

export const read: Releases["read"] = async (_ctx, id) => {
  const row = await releaseQ.getRelease(pool, { id });
  if (!row) return notFound(`release ${id} not found`);
  return toRelease(row);
};
