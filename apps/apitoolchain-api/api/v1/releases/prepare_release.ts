import * as gitQ from "../../../dbnode/git";
import { pool } from "../../../dbnode/pool";
import * as releaseQ from "../../../dbnode/releases";
import { prepareReleaseForConnection } from "../../../genframework/release";
import type { Releases } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { notFound } from "../__kit/errors";
import { toRelease } from "../__kit/mappers";

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
