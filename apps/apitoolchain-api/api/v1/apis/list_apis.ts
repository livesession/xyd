import { registryClient } from "../../../clients/registry";
import type { Apis } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { toRegistryEntry } from "../__kit/mappers";
import { rollups } from "./rollups";

/** GET /apis — the current project's registry entries, enriched with rollups. */
export const listApis: Apis["list"] = async (ctx) => {
  const auth = await requireAuth(ctx);
  const [cores, r] = await Promise.all([
    registryClient.listApis(auth.projectId),
    rollups(),
  ]);
  return cores.map((c) =>
    toRegistryEntry(c, {
      sdk: r.sdk.get(c.id) ?? 0,
      docs: r.docs.get(c.id) ?? 0,
      mcp: r.mcp.get(c.id) ?? 0,
    }),
  );
};
