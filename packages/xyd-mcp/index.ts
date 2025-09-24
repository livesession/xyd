import express from "express";

import { MCPServer } from "./api/mcp";

const mcp = new MCPServer();
const app = express();

app.use(express.json());

// Handle POST requests for client-to-server communication
app.post("/mcp", mcp.handleConnectionRequest);
// Handle GET requests for server-to-client notifications via SSE
app.get("/mcp", mcp.handleSessionRequest);
// Handle DELETE requests for session termination
app.delete("/mcp", mcp.handleSessionRequest);

app.listen(process.env.PORT || 3000);
