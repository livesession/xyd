import { registryClient } from "../../../clients/registry";
import type { Apis } from "../../openapi/v1/src/generated/models/all/platform-api";
import { notFound } from "../__kit/errors";
import { toRegistryEntry } from "../__kit/mappers";
import { rollups } from "./rollups";

/** GET /apis/{apiId} — one enriched registry entry, or 404. */
export const getApi: Apis["read"] = async (_ctx, apiId) => {
  const core = await registryClient.getApi(apiId);
  if (!core) return notFound(`api ${apiId} not found`);
  const r = await rollups();
  return toRegistryEntry(core, {
    sdk: r.sdk.get(apiId) ?? 0,
    docs: r.docs.get(apiId) ?? 0,
    mcp: r.mcp.get(apiId) ?? 0,
  });
};
