import { pool } from "../../../dbnode/pool";
import * as regQ from "../../../dbnode/registries";
import { randomId } from "../../../util";
import type { PackageRegistries } from "../../openapi/v1/src/generated/models/all/platform-api";
import { invalid } from "../__kit/errors";
import { toPackageRegistry } from "../__kit/mappers";

/**
 * POST /package-registries — connect a registry account. The token is stored
 * server-side only. (Re-)connecting the same kind+url refreshes the token in
 * place so any registry_connections stay attached.
 */
export const create: PackageRegistries["create"] = async (_ctx, input) => {
  const url = (input.url ?? "").trim();
  if (!url) return invalid("a registry URL is required");
  const existing = await regQ.findPackageRegistryByUrl(pool, {
    kind: input.kind,
    url,
  });
  if (existing) {
    const updated = await regQ.updatePackageRegistryToken(pool, {
      id: existing.id,
      token: input.token ?? "",
      name: input.name ?? existing.name,
    });
    return toPackageRegistry(updated as NonNullable<typeof updated>);
  }
  const row = await regQ.insertPackageRegistry(pool, {
    id: randomId("preg"),
    kind: input.kind,
    name: input.name ?? `${input.kind} registry`,
    url,
    token: input.token ?? "",
    connectedAs: "",
  });
  return toPackageRegistry(row as NonNullable<typeof row>);
};
