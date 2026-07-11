import { registryClient } from "../../../clients/registry";
import * as jobQ from "../../../dbnode/jobs";
import { pool } from "../../../dbnode/pool";
import * as buildQ from "../../../dbnode/sdk_builds";
import * as sdkQ from "../../../dbnode/sdk_targets";
import * as sdksQ from "../../../dbnode/sdks";
import { runSdkGeneration } from "../../../genframework/sdk";
import { currentVersion, randomId, slugify, targetTitle } from "../../../util";
import type { Sdks } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { invalid, notFound } from "../__kit/errors";
import { toSdkTarget } from "../__kit/mappers";

/**
 * POST /sdks/{sdkId}/targets — add a language target to an SDK: insert a
 * `building` row + job and kick the (off-request) opensdk generation for the
 * SDK's API. OpenAPI-only.
 */
export const addTarget: Sdks["addTarget"] = async (ctx, sdkId, input) => {
  const auth = await requireAuth(ctx);
  const sdk = await sdksQ.getSdk(pool, { id: sdkId });
  if (!sdk) return notFound(`sdk ${sdkId} not found`);
  const core = await registryClient.getApi(sdk.apiId);
  if (!core) return notFound(`api ${sdk.apiId} not found`);
  if (core.format !== "openapi") {
    return invalid("SDK generation is only supported for OpenAPI specs");
  }
  // Generate from the requested version if it's a known one, else the current.
  const known = (core.versions ?? []).map((v) => v.version);
  const version =
    input.version && known.includes(input.version)
      ? input.version
      : currentVersion(core);
  // Friendly, stable target id — "<sdk>-<language>" (e.g.
  // livesession-api-sdk-node), from the SDK's own id (what the user named), NOT
  // the API id. Fall back to a short random suffix on the rare collision.
  const base = slugify(`${sdk.id}-${input.language}`) || randomId("sdkt");
  let id = base;
  if (await sdkQ.getSdkTarget(pool, { id })) {
    id = `${base}-${randomId("t").slice(2)}`;
  }
  const row = await sdkQ.insertSdkTarget(pool, {
    id,
    sdkId,
    apiId: sdk.apiId,
    apiVersion: version,
    language: input.language,
    // Human display title, fixed at creation — from the SDK's name (what the
    // user set, e.g. "LiveSession API SDK") + language, NOT the API's name.
    name: targetTitle(sdk.name, input.language),
    packageName: input.packageName ?? "",
    // Default to the repo root — a target typically maps to a dedicated,
    // single-language SDK repo, so the SDK IS the repo, not a subfolder.
    output: ".",
    version: "",
    status: "building",
    projectId: auth.projectId,
    // The custom sdk.json (wizard flow), if any — persisted so rebuilds reuse it.
    sdkJson: input.sdkJson ?? "",
  });
  const job = await jobQ.insertJob(pool, {
    id: randomId("job"),
    kind: "sdk.generate",
    targetRef: id,
    status: "running",
    payload: { apiId: sdk.apiId, version, language: input.language },
  });
  // A newly-added target belongs to the SDK's current (latest) build, so its
  // generation logs land there.
  const builds = await buildQ.listSdkBuildsBySdk(pool, { sdkId });
  void runSdkGeneration({
    targetId: id,
    jobId: job?.id ?? "",
    apiId: sdk.apiId,
    version,
    language: input.language,
    namespace: sdk.namespace,
    sdkName: sdk.name,
    sdkId: sdk.id,
    sdkVersion: sdk.version,
    packageName: input.packageName?.trim() || undefined,
    projectId: auth.projectId,
    buildId: builds[0]?.id,
    sdkJson: input.sdkJson?.trim() || undefined,
  });
  return toSdkTarget(row as NonNullable<typeof row>);
};
