import type { Releases } from "../../../generated/src/generated/models/all/platform-api";
import { requireAuth } from "../../auth";
import * as gitQ from "../../db/generated/git_sql";
import * as releaseQ from "../../db/generated/releases_sql";
import { pool } from "../../db/pool";
import { prepareReleaseForConnection } from "../../gen/release";
import { toRelease } from "../../mappers";
import { notFound } from "../errors";

/**
 * POST /releases/prepare — open or force-update the rolling release PR for an SDK
 * connection. Upserts the active release row + a job and kicks the (off-request)
 * regenerate → diff → PR, returning the release in its `preparing` state.
 */
export const prepare: Releases["prepare"] = async (ctx, input) => {
  const auth = await requireAuth(ctx);
  const conn = await gitQ.getRepoConnection(pool, { id: input.connectionId });
  if (!conn) return notFound(`connection ${input.connectionId} not found`);

  const releaseId = await prepareReleaseForConnection({
    connectionId: input.connectionId,
    projectId: auth.projectId,
    versionOverride: input.versionOverride || undefined,
  });
  const row = await releaseQ.getRelease(pool, { id: releaseId });
  return toRelease(row as NonNullable<typeof row>);
};
