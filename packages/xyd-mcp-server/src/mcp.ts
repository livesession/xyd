import { randomUUID } from "node:crypto";

import express from "express";

import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { mcpUniformResources, mcpUniformTools, mcpLLMsResources, mcpLLMsTools } from "@xyd-js/mcp";

// Extend Express Request type to include pendingToken
declare global {
  namespace Express {
    interface Request {
      pendingToken?: string;
    }
  }
}

interface MCPServerOptions {
  uniformSources: string | string[]
  llmsSources: string | string[]
  openAIApiKey: string // TODO: support other LLMS embeddings
}

export class MCPServer {
  private transports: { [sessionId: string]: StreamableHTTPServerTransport } =
    {};

  // Store tokens by session ID
  private sessionTokens: { [sessionId: string]: string } = {};

  private uniformSources: string[] = []
  private llmsSources: string[] = []

  constructor(protected options: MCPServerOptions) {
    const { uniformSources, llmsSources } = options;

    this.connect = this.connect.bind(this);
    this.handleConnectionRequest = this.handleConnectionRequest.bind(this);
    this.handleSessionRequest = this.handleSessionRequest.bind(this);

    if (uniformSources && typeof uniformSources === "string") {
      this.uniformSources.push(uniformSources);
    } else if (uniformSources && Array.isArray(uniformSources)) {
      this.uniformSources.push(...uniformSources);
    }

    // Handle llms.txt sources
    if (llmsSources && typeof llmsSources === "string") {
      this.llmsSources.push(llmsSources);
    } else if (llmsSources && Array.isArray(llmsSources)) {
      this.llmsSources.push(...llmsSources);
    }
  }

  public async handleConnectionRequest(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    // Check for existing session ID
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && this.transports[sessionId]) {
      // Reuse existing transport
      transport = this.transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // Extract and store token
      const authorized = req.headers["authorization"];
      const bearer = authorized?.split("Bearer");
      let token = "";
      if (bearer && bearer.length > 1) {
        token = bearer[1].trim();
      }

      transport = await this.connect(token);
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
  }

  public async handleSessionRequest(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !this.transports[sessionId]) {
      res.status(400).send("Invalid or missing session ID");
      return;
    }

    const transport = this.transports[sessionId];
    await transport.handleRequest(req, res);
  }

  private async connect(
    token?: string
  ): Promise<StreamableHTTPServerTransport> {
    // New initialization request
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        // Store the transport by session ID
        this.transports[sessionId] = transport;

        // Store the token for this session if we have one
        if (token) {
          this.sessionTokens[sessionId] = token;
        }
      },
      // DNS rebinding protection is disabled by default for backwards compatibility. If you are running this server
      // locally, make sure to set:
      // enableDnsRebindingProtection: true,
      // allowedHosts: ['127.0.0.1'],
    });

    // Clean up transport when closed
    transport.onclose = () => {
      if (transport.sessionId) {
        delete this.transports[transport.sessionId];
        delete this.sessionTokens[transport.sessionId];
        console.log("Cleaned up session:", transport.sessionId);
      }
    };

    const server = new McpServer({
      name: "xyd-mcp-server",
      version: "1.0.0",
    });

    // TODO: !!! support multiple sources !!!
    const source = this.uniformSources[0] || ""

    if (this.uniformSources[0]) {
      await mcpUniformResources(server, source);
    }
    
    await mcpUniformTools(server, source || "", token || "");

    // Add llms.txt resources and tools
    if (this.llmsSources.length > 0) {
      // await mcpLLMsResources(server, this.llmsSources);
      await mcpLLMsTools(server, this.llmsSources, this.options.openAIApiKey);
    }

    // Add simple token tool
    this.addSimpleTokenTool(server);

    // Connect to the MCP server
    await server.connect(transport);

    return transport;
  }

  // Simple method to add a token info tool
  private addSimpleTokenTool(server: McpServer): void {
    server.registerTool(
      "get_token_info",
      {
        title: "Get Token Info",
        description:
          "Display information about the stored authentication token",
        inputSchema: {},
      },
      async () => {
        // Get all session info
        const sessionCount = Object.keys(this.sessionTokens).length;
        const sessions = Object.keys(this.sessionTokens);

        if (sessionCount === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No authentication tokens found in any session",
              },
            ],
          };
        }

        let result = `Found ${sessionCount} session(s) with tokens:\n\n`;

        for (const sessionId of sessions) {
          const token = this.sessionTokens[sessionId];
          const maskedToken =
            token.length > 10
              ? `${token.substring(0, 6)}...${token.substring(token.length - 4)}`
              : "***";

          result += `Session: ${sessionId}\n`;
          result += `Token (masked): ${maskedToken}\n`;
          result += `Token length: ${token.length} characters\n\n`;
        }

        return {
          content: [
            {
              type: "text",
              text: result,
            },
          ],
        };
      }
    );
  }

  // Method to get token for a specific session
  public getSessionToken(sessionId: string): string | undefined {
    return this.sessionTokens[sessionId];
  }

  // Method to get active session count
  private getActiveSessionCount(): number {
    return Object.keys(this.transports).length;
  }

  // Method to clean up a specific session
  private cleanupSession(sessionId: string): boolean {
    if (this.transports[sessionId]) {
      delete this.transports[sessionId];
      delete this.sessionTokens[sessionId];
      return true;
    }
    return false;
  }

  // Method to clean up all sessions
  private cleanupAllSessions(): void {
    this.transports = {};
    this.sessionTokens = {};
  }

}
