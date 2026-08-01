import { registryClient } from "../../../clients/registry";
import { pool } from "../../../dbnode/pool";
import * as buildQ from "../../../dbnode/sdk_builds";
import * as sdksQ from "../../../dbnode/sdks";
import { currentVersion, randomId, slugify } from "../../../util";
import type { Sdks } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { invalid, notFound } from "../__kit/errors";
import { toSdk } from "../__kit/mappers";

/** POST /sdks — create a named SDK for an API (targets added separately). */
export const createSdk: Sdks["create"] = async (ctx, input) => {
  const auth = await requireAuth(ctx);
  const core = await registryClient.getApi(input.apiId);
  if (!core) return notFound(`api ${input.apiId} not found`);
  const name = input.name?.trim() || `${core.name} SDK`;
  // The id may be set explicitly (decoupled from the display name), else derived
  // from the name — same pattern as the registry. Either way it's slugified so
  // it's URL/package-safe. Ids are the SDK primary key, so a clash is a clean
  // validation error (not a 500) — the modal surfaces it and asks for another.
  const id = slugify(input.id || name);
  const existing = await sdksQ.getSdk(pool, { id });
  if (existing) {
    return invalid(
      `SDK id "${id}" is already taken — choose a different name or id.`,
    );
  }
  const row = await sdksQ.insertSdk(pool, {
    id,
    apiId: input.apiId,
    name,
    description: input.description ?? "",
    // SDKs inherit their API's namespace (never empty). `||` (not `??`) so an
    // empty-string ns falls through to the inherited value.
    namespace: core.ns?.trim() || input.ns?.trim() || "default",
    projectId: auth.projectId,
  });
  const sdk = toSdk(row as NonNullable<typeof row>, 0);
  // Record the SDK's initial version as its first build so it shows in the
  // Versions history immediately. Targets are added right after (empty snapshot
  // now; the Versions tab surfaces the live targets while this is the latest
  // build, and freezes the snapshot when a newer version supersedes it).
  await buildQ.insertSdkBuild(pool, {
    id: randomId("sdkb"),
    sdkId: id,
    version: sdk.version,
    apiVersion: currentVersion(core),
    status: "building",
    targets: "[]",
    projectId: auth.projectId,
  });
  return sdk;
};
