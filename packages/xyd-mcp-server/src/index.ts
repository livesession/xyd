import express from "express";

import { MCPServer } from "./mcp";

// Support both uniform sources and llms.txt sources
const uniformSources = process.argv[2];
const llmsSources = process.argv[3];

const mcp = new MCPServer({
    uniformSources,
    llmsSources,
    openAIApiKey: process.env.OPENAI_API_KEY || "", // TODO: configurable
});
const app = express();

app.use(express.json());

app.post("/mcp", mcp.handleConnectionRequest);
app.get("/mcp", mcp.handleSessionRequest);
app.delete("/mcp", mcp.handleSessionRequest);

const port = process.env.PORT || 3000;
console.log("Running MCP server on port", port);

app.listen(port);
