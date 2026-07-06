import type { Releases } from "../../../generated/src/generated/models/all/platform-api";
import { read } from "./get_release";
import { list } from "./list_releases";
import { prepare } from "./prepare_release";
import { publish } from "./publish_release";

export const releases: Releases = { list, read, prepare, publish };
