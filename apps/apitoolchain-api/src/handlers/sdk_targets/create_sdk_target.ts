import type { SdkTargets } from "../../../generated/src/generated/models/all/platform-api";
import { registryClient } from "../../clients/registry";
import * as jobQ from "../../db/generated/jobs_sql";
import * as sdkQ from "../../db/generated/sdk_targets_sql";
import { pool } from "../../db/pool";
import { runSdkGeneration, SDK_OUTPUT } from "../../gen/sdk";
import { toSdkTarget } from "../../mappers";
import { currentVersion, randomId } from "../../util";
import { invalid, notFound } from "../errors";

/**
 * POST /sdk-targets — insert a `building` row + job, return immediately, and
 * kick the (off-request) opensdk generation. OpenAPI-only.
 */
export const createSdkTarget: SdkTargets["create"] = async (_ctx, input) => {
  const core = await registryClient.getApi(input.apiId);
  if (!core) return notFound(`api ${input.apiId} not found`);
  if (core.format !== "openapi") {
    return invalid("SDK generation is only supported for OpenAPI specs");
  }
  const version = currentVersion(core);
  const id = randomId("sdk");
  const row = await sdkQ.insertSdkTarget(pool, {
    id,
    apiId: input.apiId,
    apiVersion: version,
    language: input.language,
    packageName: input.packageName ?? "",
    output: SDK_OUTPUT[input.language] ?? `./sdk/${input.language}`,
    version: input.version ?? "",
    status: "building",
  });
  const job = await jobQ.insertJob(pool, {
    id: randomId("job"),
    kind: "sdk.generate",
    targetRef: id,
    status: "running",
    payload: { apiId: input.apiId, version, language: input.language },
  });
  void runSdkGeneration({
    targetId: id,
    jobId: job?.id ?? "",
    apiId: input.apiId,
    version,
    language: input.language,
  });
  return toSdkTarget(row as NonNullable<typeof row>);
};
