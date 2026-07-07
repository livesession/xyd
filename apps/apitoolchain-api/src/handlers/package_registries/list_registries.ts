import type { PackageRegistries } from "../../../generated/src/generated/models/all/platform-api";
import * as regQ from "../../db/generated/registries_sql";
import { pool } from "../../db/pool";
import { toPackageRegistry } from "../../mappers";

/** GET /package-registries — connected registries (tokens never leave the server). */
export const list: PackageRegistries["list"] = async () =>
  (await regQ.listPackageRegistries(pool)).map(toPackageRegistry);
