import { pool } from "../../../dbnode/pool";
import * as regQ from "../../../dbnode/registries";
import type { PackageRegistries } from "../../openapi/v1/src/generated/models/all/platform-api";
import { notFound } from "../__kit/errors";

/** DELETE /package-registries/{id} — cascades to its registry connections. */
export const remove: PackageRegistries["remove"] = async (_ctx, id) => {
  const r = await regQ.getPackageRegistry(pool, { id });
  if (!r) return notFound(`package registry ${id} not found`);
  await regQ.deletePackageRegistry(pool, { id });
};
