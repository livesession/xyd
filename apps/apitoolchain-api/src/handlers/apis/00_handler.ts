import type { Apis } from "../../../generated/src/generated/models/all/platform-api";
import { getApi } from "./get_api";
import { listApis } from "./list_apis";
import { registerApi } from "./register_api";
import { setDistTag } from "./set_dist_tag";

/** `/apis` — the gateway namespace (proxies registry-api + fills rollups). */
export const apis: Apis = {
  list: listApis,
  read: getApi,
  register: registerApi,
  setDistTag,
};
