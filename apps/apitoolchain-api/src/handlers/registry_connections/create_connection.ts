import type { RegistryConnections } from "../../../generated/src/generated/models/all/platform-api";
import * as regQ from "../../db/generated/registries_sql";
import * as sdkQ from "../../db/generated/sdk_targets_sql";
import { pool } from "../../db/pool";
import { toRegistryConnection } from "../../mappers";
import { randomId } from "../../util";
import { notFound } from "../errors";

/**
 * POST /registry-connections — link an SDK target to a package registry. The
 * language is taken from the target; the package name defaults to the SDK's own
 * generated package name.
 */
export const create: RegistryConnections["create"] = async (_ctx, input) => {
  const registry = await regQ.getPackageRegistry(pool, {
    id: input.registryId,
  });
  if (!registry)
    return notFound(`package registry ${input.registryId} not found`);
  const target = await sdkQ.getSdkTarget(pool, { id: input.targetId });
  if (!target) return notFound(`sdk target ${input.targetId} not found`);

  const row = await regQ.insertRegistryConnection(pool, {
    id: randomId("rcx"),
    registryId: input.registryId,
    targetId: input.targetId,
    language: target.language,
    packageName: input.packageName ?? target.packageName ?? "",
    autoPublish: input.autoPublish ?? true,
  });
  return toRegistryConnection(row as NonNullable<typeof row>);
};
