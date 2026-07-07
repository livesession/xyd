import type { Sdks } from "../../../generated/src/generated/models/all/platform-api";
import { requireAuth } from "../../auth";
import { registryClient } from "../../clients/registry";
import * as jobQ from "../../db/generated/jobs_sql";
import * as sdkQ from "../../db/generated/sdk_targets_sql";
import * as sdksQ from "../../db/generated/sdks_sql";
import { pool } from "../../db/pool";
import { runSdkGeneration } from "../../gen/sdk";
import { toSdkTarget } from "../../mappers";
import { currentVersion, randomId } from "../../util";
import { invalid, notFound } from "../errors";

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
  const id = randomId("sdkt");
  const row = await sdkQ.insertSdkTarget(pool, {
    id,
    sdkId,
    apiId: sdk.apiId,
    apiVersion: version,
    language: input.language,
    packageName: input.packageName ?? "",
    // Default to the repo root — a target typically maps to a dedicated,
    // single-language SDK repo, so the SDK IS the repo, not a subfolder.
    output: ".",
    version: "",
    status: "building",
    projectId: auth.projectId,
  });
  const job = await jobQ.insertJob(pool, {
    id: randomId("job"),
    kind: "sdk.generate",
    targetRef: id,
    status: "running",
    payload: { apiId: sdk.apiId, version, language: input.language },
  });
  void runSdkGeneration({
    targetId: id,
    jobId: job?.id ?? "",
    apiId: sdk.apiId,
    version,
    language: input.language,
    namespace: sdk.namespace,
    projectId: auth.projectId,
  });
  return toSdkTarget(row as NonNullable<typeof row>);
};
