import { MCPServer } from "@xyd-js/mcp-server/mcp";

import { startServer } from "./src/index";

const source = process.env.MCP_SOURCE;

if (!source) {
  throw new Error("MCP_SOURCE is not set");
}

startServer(new MCPServer(source)).catch(console.error);
