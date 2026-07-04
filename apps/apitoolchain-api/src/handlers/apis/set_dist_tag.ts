import type { Apis } from "../../../generated/src/generated/models/all/platform-api";
import { registryClient } from "../../clients/registry";
import { toRegistryEntry } from "../../mappers";
import { invalid } from "../errors";
import { rollups } from "./rollups";

/** POST /apis/{apiId}/dist-tags — proxy the dist-tag move to registry-api. */
export const setDistTag: Apis["setDistTag"] = async (_ctx, apiId, input) => {
  const res = await registryClient.setDistTag(apiId, input);
  if (!res.ok) return invalid(res.message);
  const r = await rollups();
  return toRegistryEntry(res.entry, {
    sdk: r.sdk.get(apiId) ?? 0,
    docs: r.docs.get(apiId) ?? 0,
    mcp: r.mcp.get(apiId) ?? 0,
  });
};
