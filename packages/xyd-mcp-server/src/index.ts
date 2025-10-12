import express from "express";

import { MCPServer } from "./mcp";

const mcp = new MCPServer();
const app = express();

app.use(express.json());

app.post("/mcp", mcp.handleConnectionRequest);
app.get("/mcp", mcp.handleSessionRequest);
app.delete("/mcp", mcp.handleSessionRequest);

const port = process.env.PORT || 3000;
console.log("Running MCP server on port", port);

app.listen(port);
