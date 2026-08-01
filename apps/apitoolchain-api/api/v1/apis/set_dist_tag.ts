import { registryClient } from "../../../clients/registry";
import { enqueueReleasesForApi } from "../../../genframework/release";
import type { Apis } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { invalid } from "../__kit/errors";
import { toRegistryEntry } from "../__kit/mappers";
import { rollups } from "./rollups";

/** POST /apis/{apiId}/dist-tags — proxy the dist-tag move to registry-api. */
export const setDistTag: Apis["setDistTag"] = async (ctx, apiId, input) => {
  const auth = await requireAuth(ctx);
  const res = await registryClient.setDistTag(apiId, input);
  if (!res.ok) return invalid(res.message);
  // A dist-tag move points that tag's connections at a new version → refresh
  // only the connections configured for this dist-tag.
  void enqueueReleasesForApi(apiId, input.version, input.tag, auth.projectId);
  const r = await rollups();
  return toRegistryEntry(res.entry, {
    sdk: r.sdk.get(apiId) ?? 0,
    docs: r.docs.get(apiId) ?? 0,
    mcp: r.mcp.get(apiId) ?? 0,
  });
};
