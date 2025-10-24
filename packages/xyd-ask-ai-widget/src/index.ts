import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";

import express from "express";

import { handler as askAiHandler } from "@xyd-js/ask-ai/node";
import type { MCPServer } from "@xyd-js/mcp-server/mcp";

import type { Settings } from "./settings";

// Start the server
export async function startServer(
  settings: Settings,
  mcpServer?: MCPServer
) {
  const widgetPath = findWidgetPath();
  console.log("✅ Widget found:", widgetPath);

  // Find an available port
  const port = await findAvailablePort(parseInt(process.env.PORT || "3500"));
  console.log(`🔍 Trying to start server on port ${port}...`);

  const app = express();

  // Parse JSON bodies
  app.use(express.json());

  // Set CORS headers
  app.use((req, res, next) => {
    res.header(settings.headers);
    next();
  });

  // Handle preflight OPTIONS requests
  app.options("*", (req, res) => {
    res.status(200).end();
  });

  // Serve the widget bundle at /widget.js
  app.get("/widget.js", (req, res) => {
    try {
      const widgetCode = readFileSync(widgetPath, "utf-8");
      res.set({
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=3600",
      });
      res.send(widgetCode);
    } catch (error) {
      res
        .status(404)
        .send("Widget not found. Please run 'bun run build:widget' first.");
    }
  });

  // Handle ask AI requests at /ask
  app.post("/ask", async (req, res) => {
    try {
      // Convert Express request to Web API Request
      const body = req.method === "POST" ? JSON.stringify(req.body) : undefined;
      const request = new Request(`http://localhost:${port}${req.url}`, {
        method: req.method,
        headers: new Headers(req.headers as Record<string, string>),
        body: body,
      });

      // TODO: check if it works
      let mcpUrl = settings.mcp?.url || request.url + "/mcp";
      if (Array.isArray(mcpUrl)) {
        console.warn("MCP as array is not supported, using the first one");
        mcpUrl = mcpUrl[0];
      }

      const askAiHandlerFn = askAiHandler({
        mcpUrl: mcpUrl,
        aiProvider: settings.ai.provider || "",
        aiModel: settings.ai.model || "",
        aiToken: settings.ai.token || "",
      });

      const response = await askAiHandlerFn(request);

      // Copy response headers
      for (const [key, value] of response.headers.entries()) {
        res.set(key, value);
      }

      res.status(response.status);

      // Stream the response body
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            res.write(chunk);
          }
          res.end();
        } catch (error) {
          console.error("Streaming error:", error);
          res.end();
        } finally {
          reader.releaseLock();
        }
      } else {
        res.end();
      }
    } catch (error) {
      console.error("Ask AI error:", error);
      res.status(500).send("Internal server error");
    }
  });

  // Handle MCP requests at /mcp
  if (mcpServer) {
    app.post("/mcp", mcpServer.handleConnectionRequest);
    app.get("/mcp", mcpServer.handleSessionRequest);
    app.delete("/mcp", mcpServer.handleSessionRequest);
  }

  // 404 handler
  app.use((req, res) => {
    res.status(404).send("Not found");
  });

  app.listen(port, () => {
    console.log(`🚀 Widget server running at http://localhost:${port}`);
    console.log(`📦 Widget bundle: http://localhost:${port}/widget.js`);
    console.log(`🤖 Ask AI endpoint: http://localhost:${port}/ask`);
    if (mcpServer) {
      console.log(`🤖 MCP endpoint: http://localhost:${port}/mcp`);
    }
  });
}

// Find the widget file in multiple possible locations
function findWidgetPath(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Look for widget in multiple possible locations
  const possiblePaths = [
    join(process.cwd(), "dist", "widget.js"), // Local development
    join(__dirname, "..", "dist", "widget.js"), // Package installation
    join(__dirname, "dist", "widget.js"), // Alternative package location
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  console.log("❌ Widget not found!");
  console.log("🔨 Please run: bun run build:widget");
  console.log("💡 Searched in:", possiblePaths);
  process.exit(1);
}

// Find an available port
async function findAvailablePort(startPort = 3500, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    try {
      await new Promise((resolve, reject) => {
        const testServer = createServer();
        testServer.listen(port, () => {
          testServer.close();
          resolve(undefined);
        });
        testServer.on("error", reject);
      });
      return port;
    } catch (error) {
      // Port is in use, try next one
      continue;
    }
  }
  throw new Error(
    `No available ports found between ${startPort} and ${startPort + maxAttempts - 1}`
  );
}
