import * as keyQ from "../../../dbnode/api_keys";
import { pool } from "../../../dbnode/pool";
import type { ApiKeys } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { toApiKey } from "../__kit/mappers";

/** GET /api-keys — the current project's API keys (never the secret). */
export const listApiKeys: ApiKeys["list"] = async (ctx) => {
  const auth = await requireAuth(ctx);
  const rows = await keyQ.listApiKeys(pool, { projectId: auth.projectId });
  return rows.map(toApiKey);
};
