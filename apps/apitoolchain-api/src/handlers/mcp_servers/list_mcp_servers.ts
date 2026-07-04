import type { McpServers } from "../../../generated/src/generated/models/all/platform-api";
import * as outQ from "../../db/generated/outputs_sql";
import { pool } from "../../db/pool";
import { toMcpServer } from "../../mappers";

/** GET /mcp-servers(?apiId=) */
export const listMcpServers: McpServers["list"] = async (_ctx, options) => {
  const rows = options?.apiId
    ? await outQ.listMcpServersByApi(pool, { apiId: options.apiId })
    : await outQ.listMcpServers(pool);
  return rows.map(toMcpServer);
};
