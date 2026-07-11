import type { Apis } from "../../openapi/v1/src/generated/models/all/platform-api";
import { getApi } from "./get_api";
import { listApis } from "./list_apis";
import { registerApi } from "./register_api";
import { setDistTag } from "./set_dist_tag";
import { updateApi } from "./update_api";

/** `/apis` — the gateway namespace (proxies registry-api + fills rollups). */
export const apis: Apis = {
  list: listApis,
  read: getApi,
  register: registerApi,
  update: updateApi,
  setDistTag,
};
