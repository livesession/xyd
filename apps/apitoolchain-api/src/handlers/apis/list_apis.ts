import type { Apis } from "../../../generated/src/generated/models/all/platform-api";
import { requireAuth } from "../../auth";
import { registryClient } from "../../clients/registry";
import { toRegistryEntry } from "../../mappers";
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
