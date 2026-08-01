import { registryClient } from "../../../clients/registry";
import * as jobQ from "../../../dbnode/jobs";
import { pool } from "../../../dbnode/pool";
import * as buildQ from "../../../dbnode/sdk_builds";
import * as sdkQ from "../../../dbnode/sdk_targets";
import * as sdksQ from "../../../dbnode/sdks";
import { runSdkGeneration } from "../../../genframework/sdk";
import { currentVersion, randomId } from "../../../util";
import type { Sdks } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { invalid, notFound } from "../__kit/errors";
import { toSdkBuild } from "../__kit/mappers";

/**
 * POST /sdks/{sdkId}/versions — create a new SDK version: record a build, bump
 * the SDK's own version, and rebuild EVERY target from one API spec version
 * (defaults to the API's current). The build is kept as history (Versions tab);
 * a `targets` snapshot captures which language targets went into it.
 */
export const createVersion: Sdks["createVersion"] = async (
  ctx,
  sdkId,
  input,
) => {
  const auth = await requireAuth(ctx);
  const sdk = await sdksQ.getSdk(pool, { id: sdkId });
  if (!sdk) return notFound(`sdk ${sdkId} not found`);
  const version = (input.version ?? "").trim();
  if (!version) return invalid("version is required");
  const core = await registryClient.getApi(sdk.apiId);
  if (!core) return notFound(`api ${sdk.apiId} not found`);
  if (core.format !== "openapi") {
    return invalid("SDK generation is only supported for OpenAPI specs");
  }
  const known = (core.versions ?? []).map((v) => v.version);
  const apiVersion =
    input.apiVersion && known.includes(input.apiVersion)
      ? input.apiVersion
      : currentVersion(core);

  const targets = await sdkQ.listSdkTargetsBySdk(pool, { sdkId });
  if (targets.length === 0) return invalid("this SDK has no targets to build");

  const snapshot = targets.map((t) => ({
    language: t.language,
    packageName: t.packageName,
  }));
  // Freeze the outgoing (latest existing) build's target snapshot to the live
  // targets so its history stays accurate once it's no longer the current build,
  // then supersede any still-building build and record the new one.
  const existing = await buildQ.listSdkBuildsBySdk(pool, { sdkId });
  if (existing[0]) {
    await buildQ.updateSdkBuildTargets(pool, {
      id: existing[0].id,
      targets: JSON.stringify(snapshot),
    });
  }
  await buildQ.markSdkBuildsSuperseded(pool, { sdkId });
  const build = await buildQ.insertSdkBuild(pool, {
    id: randomId("sdkb"),
    sdkId,
    version,
    apiVersion,
    status: "building",
    targets: JSON.stringify(snapshot),
    projectId: auth.projectId,
  });
  if (!build) return invalid("could not record the build");
  // Bump the SDK's own version to the one this build produced.
  await sdksQ.updateSdkVersion(pool, { id: sdkId, version });

  // Rebuild every target from the chosen API version (async generation).
  for (const t of targets) {
    await sdkQ.markSdkTargetBuilding(pool, { id: t.id, apiVersion });
    const job = await jobQ.insertJob(pool, {
      id: randomId("job"),
      kind: "sdk.generate",
      targetRef: t.id,
      status: "running",
      payload: { apiId: sdk.apiId, version: apiVersion, language: t.language },
    });
    void runSdkGeneration({
      targetId: t.id,
      jobId: job?.id ?? "",
      apiId: sdk.apiId,
      version: apiVersion,
      language: t.language,
      namespace: sdk.namespace,
      sdkName: sdk.name,
      sdkId: sdk.id,
      // The SDK's own version this build produces (bumped above) — sdk.json's
      // `sdk` ref reflects the version being generated, not the previous one.
      sdkVersion: version,
      // Honor the target's own (source-of-truth) package name — a connected
      // publisher's; empty falls back to the id-derived default.
      packageName: t.packageName || undefined,
      projectId: auth.projectId,
      buildId: build.id,
      // Reuse the target's custom sdk.json (wizard flow) on rebuild.
      sdkJson: t.sdkJson || undefined,
    });
  }
  return toSdkBuild(build);
};
