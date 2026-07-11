import { pool } from "../../../dbnode/pool";
import * as regQ from "../../../dbnode/registries";
import type { PackageRegistries } from "../../openapi/v1/src/generated/models/all/platform-api";
import { toPackageRegistry } from "../__kit/mappers";

/** GET /package-registries — connected registries (tokens never leave the server). */
export const list: PackageRegistries["list"] = async () =>
  (await regQ.listPackageRegistries(pool)).map(toPackageRegistry);
