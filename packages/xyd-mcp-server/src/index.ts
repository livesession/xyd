import express from "express";

import { MCPServer } from "./mcp";

const mcp = new MCPServer();
const app = express();

app.use(express.json());

app.post("/mcp", mcp.handleConnectionRequest);
app.get("/mcp", mcp.handleSessionRequest);
app.delete("/mcp", mcp.handleSessionRequest);

app.listen(process.env.PORT || 3000);

