import * as jobQ from "../../../dbnode/jobs";
import { pool } from "../../../dbnode/pool";
import * as regQ from "../../../dbnode/registries";
import * as sdkQ from "../../../dbnode/sdk_targets";
import * as sdksQ from "../../../dbnode/sdks";
import { runSdkGeneration } from "../../../genframework/sdk";
import { randomId } from "../../../util";
import type { RegistryConnections } from "../../openapi/v1/src/generated/models/all/platform-api";
import { notFound } from "../__kit/errors";
import { toRegistryConnection } from "../__kit/mappers";

/**
 * POST /registry-connections — link an SDK target to a package registry. The
 * language is taken from the target; the package name defaults to the SDK's own
 * generated package name.
 *
 * The connection's package name is the SOURCE OF TRUTH for what this SDK is
 * called on that registry — so when it differs from the name the target was
 * generated under, we bake it back down into the artifact (sdk.json + the
 * manifest + README import) by regenerating, so a fresh download reflects
 * `@scope/name` rather than the id-derived default.
 */
export const create: RegistryConnections["create"] = async (_ctx, input) => {
  const registry = await regQ.getPackageRegistry(pool, {
    id: input.registryId,
  });
  if (!registry)
    return notFound(`package registry ${input.registryId} not found`);
  const target = await sdkQ.getSdkTarget(pool, { id: input.targetId });
  if (!target) return notFound(`sdk target ${input.targetId} not found`);

  const packageName = (input.packageName ?? target.packageName ?? "").trim();
  const row = await regQ.insertRegistryConnection(pool, {
    id: randomId("rcx"),
    registryId: input.registryId,
    targetId: input.targetId,
    language: target.language,
    packageName,
    autoPublish: input.autoPublish ?? true,
  });

  // Flow the new package name down to the artifact (regen is fire-and-forget, the
  // same off-request path add_target/build use). No-op when it matches what the
  // target already carries — a publisher connected under the default name.
  if (packageName && packageName !== target.packageName) {
    const sdk = await sdksQ.getSdk(pool, { id: target.sdkId });
    if (sdk) {
      await sdkQ.markSdkTargetBuilding(pool, {
        id: target.id,
        apiVersion: target.apiVersion,
      });
      const job = await jobQ.insertJob(pool, {
        id: randomId("job"),
        kind: "sdk.generate",
        targetRef: target.id,
        status: "running",
        payload: {
          apiId: target.apiId,
          version: target.apiVersion,
          language: target.language,
        },
      });
      // Logs stream to the target's own build_logs (tailed on the publishing
      // tab); no buildId — a connect regen isn't a versioned build.
      void runSdkGeneration({
        targetId: target.id,
        jobId: job?.id ?? "",
        apiId: target.apiId,
        version: target.apiVersion,
        language: target.language,
        namespace: sdk.namespace,
        sdkName: sdk.name,
        sdkId: sdk.id,
        sdkVersion: sdk.version,
        packageName,
        projectId: target.projectId,
      });
    }
  }

  return toRegistryConnection(row as NonNullable<typeof row>);
};
