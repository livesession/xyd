import { registryClient } from "../../../clients/registry";
import type { Apis } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { invalid, notFound } from "../__kit/errors";
import { toRegistryEntry } from "../__kit/mappers";
import { rollups } from "./rollups";

/**
 * PATCH /apis/{apiId} — proxy the rename to registry-api and fold the rollup
 * counts back on (like `read`). Only the display name + description change; the
 * id, namespace, format, and kind are immutable.
 */
export const updateApi: Apis["update"] = async (ctx, apiId, input) => {
  await requireAuth(ctx);
  const core = await registryClient.getApi(apiId);
  if (!core) return notFound(`api ${apiId} not found`);
  const res = await registryClient.updateApi(apiId, input);
  if (!res.ok) return invalid(res.message);
  const r = await rollups();
  return toRegistryEntry(res.entry, {
    sdk: r.sdk.get(apiId) ?? 0,
    docs: r.docs.get(apiId) ?? 0,
    mcp: r.mcp.get(apiId) ?? 0,
  });
};
