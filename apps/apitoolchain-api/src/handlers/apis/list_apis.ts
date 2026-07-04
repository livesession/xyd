import type { Apis } from "../../../generated/src/generated/models/all/platform-api";
import { registryClient } from "../../clients/registry";
import { toRegistryEntry } from "../../mappers";
import { rollups } from "./rollups";

/** GET /apis — registry entries enriched with output rollup counts. */
export const listApis: Apis["list"] = async () => {
  const [cores, r] = await Promise.all([registryClient.listApis(), rollups()]);
  return cores.map((c) =>
    toRegistryEntry(c, {
      sdk: r.sdk.get(c.id) ?? 0,
      docs: r.docs.get(c.id) ?? 0,
      mcp: r.mcp.get(c.id) ?? 0,
    }),
  );
};
