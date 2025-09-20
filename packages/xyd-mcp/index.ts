import { randomUUID } from "node:crypto";

import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import {deferencedOpenAPI, oapSchemaToReferences} from "@xyd-js/openapi"
import { z } from "zod";

const app = express();
app.use(express.json());

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Handle POST requests for client-to-server communication
app.post("/mcp", async (req, res) => {
  // Check for existing session ID
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  console.log('sessionId', sessionId)
  if (sessionId && transports[sessionId]) {
    // Reuse existing transport
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    const openApiSpec = await deferencedOpenAPI("./openapi.json" as string)
    if (openApiSpec) {
      const references = await oapSchemaToReferences(openApiSpec)
      console.log("references", references)
    }

    // New initialization request
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        // Store the transport by session ID
        transports[sessionId] = transport;
      },
      // DNS rebinding protection is disabled by default for backwards compatibility. If you are running this server
      // locally, make sure to set:
      // enableDnsRebindingProtection: true,
      // allowedHosts: ['127.0.0.1'],
    });

    // Clean up transport when closed
    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };
    const server = new McpServer({
      name: "xyd-mcp-server",
      version: "1.0.0",
    });

    // Register tools using the new API
    server.registerTool(
      "get_weather",
      {
        title: "Weather Tool",
        description: "Get weather information for a city",
        inputSchema: {
          city: z.string().describe("The city to get weather for"),
        },
      },
      async ({ city }) => {
        const weather = {
          city,
          temperature: Math.floor(Math.random() * 40) - 10,
          condition: ["sunny", "cloudy", "rainy", "snowy"][
            Math.floor(Math.random() * 4)
          ],
          humidity: Math.floor(Math.random() * 100),
        };
        return {
          content: [
            {
              type: "text",
              text: `Weather in ${city}: ${weather.temperature}°C, ${weather.condition}, ${weather.humidity}% humidity`,
            },
          ],
        };
      }
    );

    server.registerTool(
      "calculate",
      {
        title: "Calculator Tool",
        description: "Perform basic arithmetic calculations",
        inputSchema: {
          expression: z
            .string()
            .describe(
              "Mathematical expression to evaluate (e.g., '2 + 3 * 4')"
            ),
        },
      },
      async ({ expression }) => {
        try {
          const result = Function(`"use strict"; return (${expression})`)();
          return {
            content: [
              {
                type: "text",
                text: `Result: ${result}`,
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Invalid expression - ${error.message}`,
              },
            ],
          };
        }
      }
    );

    // Register resources using the new API
    server.registerResource(
      "getting-started",
      "xyd://docs/getting-started",
      {
        title: "Getting Started Guide",
        description: "Basic guide to get started with XYD",
        mimeType: "text/plain",
      },
      async () => ({
        contents: [
          {
            uri: "xyd://docs/getting-started",
            mimeType: "text/plain",
            text: "# Getting Started with XYD\n\n1. Install the CLI\n2. Initialize your project\n3. Add your first component\n4. Build and deploy",
          },
        ],
      })
    );

    server.registerResource(
      "status",
      "xyd://status",
      {
        title: "Server Status",
        description: "Current server status and metrics",
        mimeType: "application/json",
      },
      async () => ({
        contents: [
          {
            uri: "xyd://status",
            mimeType: "application/json",
            text: JSON.stringify(
              {
                status: "healthy",
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      })
    );

    // Connect to the MCP server
    await server.connect(transport);
  } else {
    // Invalid request
    res.status(400).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Bad Request: No valid session ID provided",
      },
      id: null,
    });
    return;
  }

  // Handle the request
  await transport.handleRequest(req, res, req.body);
});

// Reusable handler for GET and DELETE requests
const handleSessionRequest = async (
  req: express.Request,
  res: express.Response
) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

// Handle GET requests for server-to-client notifications via SSE
app.get("/mcp", handleSessionRequest);

// Handle DELETE requests for session termination
app.delete("/mcp", handleSessionRequest);

app.listen(3000);
