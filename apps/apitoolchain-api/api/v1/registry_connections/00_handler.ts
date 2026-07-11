import type { RegistryConnections } from "../../openapi/v1/src/generated/models/all/platform-api";
import { create } from "./create_connection";
import { list } from "./list_connections";
import { publish } from "./publish_connection";
import { remove } from "./remove_connection";

export const registryConnections: RegistryConnections = {
  list,
  create,
  remove,
  publish,
};
