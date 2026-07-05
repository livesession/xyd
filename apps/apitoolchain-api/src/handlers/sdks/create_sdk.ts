import type { Sdks } from "../../../generated/src/generated/models/all/platform-api";
import { registryClient } from "../../clients/registry";
import * as sdksQ from "../../db/generated/sdks_sql";
import { pool } from "../../db/pool";
import { toSdk } from "../../mappers";
import { randomId } from "../../util";
import { notFound } from "../errors";

/** POST /sdks — create a named SDK for an API (targets added separately). */
export const createSdk: Sdks["create"] = async (_ctx, input) => {
  const core = await registryClient.getApi(input.apiId);
  if (!core) return notFound(`api ${input.apiId} not found`);
  const id = randomId("sdk");
  const name = input.name?.trim() || `${core.name} SDK`;
  const row = await sdksQ.insertSdk(pool, {
    id,
    apiId: input.apiId,
    name,
    description: input.description ?? "",
    // SDKs inherit their API's namespace (never empty). `||` (not `??`) so an
    // empty-string ns falls through to the inherited value.
    namespace: core.ns?.trim() || input.ns?.trim() || "default",
  });
  return toSdk(row as NonNullable<typeof row>, 0);
};
