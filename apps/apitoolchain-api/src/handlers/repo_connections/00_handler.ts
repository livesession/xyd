import type { RepoConnections } from "../../../generated/src/generated/models/all/platform-api";
import { create } from "./create_connection";
import { list } from "./list_connections";
import { remove } from "./remove_connection";
import { sync } from "./sync_connection";

export const repoConnections: RepoConnections = { list, create, remove, sync };
