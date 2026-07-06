import type { Apis } from "../../../generated/src/generated/models/all/platform-api";
import { requireAuth } from "../../auth";
import { registryClient } from "../../clients/registry";
import { enqueueReleasesForApi } from "../../gen/release";
import { toRegistryEntry } from "../../mappers";
import { invalid } from "../errors";
import { rollups } from "./rollups";

/** POST /apis/{apiId}/dist-tags — proxy the dist-tag move to registry-api. */
export const setDistTag: Apis["setDistTag"] = async (ctx, apiId, input) => {
  const auth = await requireAuth(ctx);
  const res = await registryClient.setDistTag(apiId, input);
  if (!res.ok) return invalid(res.message);
  // A dist-tag move can point releases at a new version → refresh their PRs.
  void enqueueReleasesForApi(apiId, input.version, auth.projectId);
  const r = await rollups();
  return toRegistryEntry(res.entry, {
    sdk: r.sdk.get(apiId) ?? 0,
    docs: r.docs.get(apiId) ?? 0,
    mcp: r.mcp.get(apiId) ?? 0,
  });
};
