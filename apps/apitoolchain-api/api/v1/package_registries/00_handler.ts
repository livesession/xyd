import type { PackageRegistries } from "../../openapi/v1/src/generated/models/all/platform-api";
import { create } from "./connect_registry";
import { list } from "./list_registries";
import { remove } from "./remove_registry";

export const packageRegistries: PackageRegistries = {
  list,
  create,
  remove,
};
