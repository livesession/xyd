import type { PackageRegistries } from "../../../generated/src/generated/models/all/platform-api";
import * as regQ from "../../db/generated/registries_sql";
import { pool } from "../../db/pool";
import { notFound } from "../errors";

/** DELETE /package-registries/{id} — cascades to its registry connections. */
export const remove: PackageRegistries["remove"] = async (_ctx, id) => {
  const r = await regQ.getPackageRegistry(pool, { id });
  if (!r) return notFound(`package registry ${id} not found`);
  await regQ.deletePackageRegistry(pool, { id });
};
