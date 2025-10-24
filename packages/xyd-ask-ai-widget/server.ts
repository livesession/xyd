import { MCPServer } from "@xyd-js/mcp-server/mcp";

import { startServer } from "./src/index";
import { loadSetting } from "./src/utils";

loadSetting()
  .then((settings) => {
    const openApiSource = settings.sources?.openapi || "";
    const llmsTxtSource = settings.sources?.llmsTxt || "";

    if (!llmsTxtSource && !openApiSource) {
      console.warn("llms txt or open api source is not set");
    }

    const mcpServer = new MCPServer({
      uniformSources: openApiSource,
      llmsSources: llmsTxtSource,
      openAIApiKey: process.env.OPENAI_API_KEY || "", // TODO: configurable
    });

    return startServer(settings, mcpServer);
  })
  .catch(console.error);
