import { registryClient } from "../../../clients/registry";
import * as jobQ from "../../../dbnode/jobs";
import { pool } from "../../../dbnode/pool";
import * as sdkQ from "../../../dbnode/sdk_targets";
import * as sdksQ from "../../../dbnode/sdks";
import { runSdkGeneration } from "../../../genframework/sdk";
import { currentVersion, randomId } from "../../../util";
import type { SdkTarget } from "../../openapi/v1/src/generated/models/all/apitoolchain";
import type { Sdks } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { invalid, notFound } from "../__kit/errors";
import { toSdkTarget } from "../__kit/mappers";

/**
 * POST /sdks/{sdkId}/build — rebuild EVERY target of an SDK from one API spec
 * version (defaults to the API's current). Each target is reset to `building`
 * with its `api_version` stamped, then the off-request opensdk generation runs.
 * This is where the API version chosen to build from is decoupled from each
 * target's own package `version` (set later, from the generated manifest).
 */
export const buildSdk: Sdks["build"] = async (ctx, sdkId, input) => {
  const auth = await requireAuth(ctx);
  const sdk = await sdksQ.getSdk(pool, { id: sdkId });
  if (!sdk) return notFound(`sdk ${sdkId} not found`);
  const core = await registryClient.getApi(sdk.apiId);
  if (!core) return notFound(`api ${sdk.apiId} not found`);
  if (core.format !== "openapi") {
    return invalid("SDK generation is only supported for OpenAPI specs");
  }
  // Build from the requested version if it's a known one, else the current.
  const known = (core.versions ?? []).map((v) => v.version);
  const version =
    input.apiVersion && known.includes(input.apiVersion)
      ? input.apiVersion
      : currentVersion(core);

  const targets = await sdkQ.listSdkTargetsBySdk(pool, { sdkId });
  if (targets.length === 0) return invalid("this SDK has no targets to build");

  const rebuilt: SdkTarget[] = [];
  for (const t of targets) {
    await sdkQ.markSdkTargetBuilding(pool, { id: t.id, apiVersion: version });
    const job = await jobQ.insertJob(pool, {
      id: randomId("job"),
      kind: "sdk.generate",
      targetRef: t.id,
      status: "running",
      payload: { apiId: sdk.apiId, version, language: t.language },
    });
    void runSdkGeneration({
      targetId: t.id,
      jobId: job?.id ?? "",
      apiId: sdk.apiId,
      version,
      language: t.language,
      namespace: sdk.namespace,
      sdkName: sdk.name,
      sdkId: sdk.id,
      sdkVersion: sdk.version,
      // Honor the target's own (source-of-truth) package name on rebuild — set by
      // a connected publisher; empty falls back to the id-derived default.
      packageName: t.packageName || undefined,
      projectId: auth.projectId,
      // Reuse the target's custom sdk.json (wizard flow) on rebuild.
      sdkJson: t.sdkJson || undefined,
    });
    rebuilt.push(
      toSdkTarget({ ...t, apiVersion: version, status: "building" }),
    );
  }
  return rebuilt;
};
