import { MCPServer } from "@xyd-js/mcp-server/mcp";

import { startServer } from "./src/index";
import { loadSetting } from "./src/utils";

loadSetting()
  .then((settings) => {
    if (!settings.mcp?.url) {
      throw new Error("MCP_SOURCE is not set");
    }

    const openApiSource = settings.mcp?.sources?.openapi || "";
    if (!openApiSource) {
      console.warn("Open API source is not set");
    }

    const mcpServer = new MCPServer(openApiSource);

    return startServer(settings, mcpServer);
  })
  .catch(console.error);
