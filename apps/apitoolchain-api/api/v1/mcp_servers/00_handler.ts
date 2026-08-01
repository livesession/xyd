import type { McpServers } from "../../openapi/v1/src/generated/models/all/platform-api";
import { createMcpServer } from "./create_mcp_server";
import { listMcpServers } from "./list_mcp_servers";

/** `/mcp-servers` — list + create (tools_count wired; process deferred). */
export const mcpServers: McpServers = {
  list: listMcpServers,
  create: createMcpServer,
};
