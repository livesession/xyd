import type { ApiKeys } from "../../openapi/v1/src/generated/models/all/platform-api";
import { createApiKey } from "./create_api_key";
import { listApiKeys } from "./list_api_keys";
import { removeApiKey } from "./remove_api_key";

/** `/api-keys` — workspace API keys (hash stored; secret shown once). */
export const apiKeys: ApiKeys = {
  list: listApiKeys,
  create: createApiKey,
  remove: removeApiKey,
};
