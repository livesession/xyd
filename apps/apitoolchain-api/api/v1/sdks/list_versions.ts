import { pool } from "../../../dbnode/pool";
import * as buildQ from "../../../dbnode/sdk_builds";
import * as sdkQ from "../../../dbnode/sdk_targets";
import * as sdksQ from "../../../dbnode/sdks";
import type { Sdks } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { notFound } from "../__kit/errors";
import { toSdkBuild } from "../__kit/mappers";

/**
 * GET /sdks/{sdkId}/versions — the SDK's build history, newest first. The latest
 * build is the only "active" one (a newer build supersedes the previous), so its
 * status is recomputed from the SDK's live targets on read and persisted.
 */
export const listVersions: Sdks["listVersions"] = async (ctx, sdkId) => {
  await requireAuth(ctx);
  const sdk = await sdksQ.getSdk(pool, { id: sdkId });
  if (!sdk) return notFound(`sdk ${sdkId} not found`);
  const builds = await buildQ.listSdkBuildsBySdk(pool, { sdkId });
  const latest = builds[0];
  if (!latest) return [];
  // The latest build is the current one: surface the SDK's LIVE targets for it
  // (its stored snapshot is only frozen once a newer version supersedes it) and
  // recompute its status from those targets.
  const targets = await sdkQ.listSdkTargetsBySdk(pool, { sdkId });
  const liveTargets = targets.map((t) => ({
    language: t.language,
    packageName: t.packageName,
  }));
  if (latest.status === "building") {
    const derived = targets.some((t) => t.status === "error")
      ? "error"
      : targets.length > 0 && targets.every((t) => t.status === "ready")
        ? "ready"
        : "building";
    if (derived !== "building") {
      await buildQ.markSdkBuildStatus(pool, { id: latest.id, status: derived });
      latest.status = derived;
    }
  }
  return builds.map((b, i) =>
    i === 0 ? toSdkBuild({ ...b, targets: liveTargets }) : toSdkBuild(b),
  );
};
