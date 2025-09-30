import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

export class XydMcpClient {
  private client: Client;
  private transport: StreamableHTTPClientTransport;
  private sessionId: string | null = null;

  constructor(private serverUrl: string = "http://localhost:3000/mcp") {
    this.transport = new StreamableHTTPClientTransport(new URL(this.serverUrl));
    this.client = new Client(
      {
        name: "xyd-mcp-client",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect(this.transport);
      console.log("✅ Connected to MCP server");
    } catch (error) {
      console.error("❌ Failed to connect to MCP server:", error);
      throw error;
    }
  }

  async listTools(): Promise<any[]> {
    try {
      const response = await this.client.listTools();
      console.log("🔧 Available tools:", response.tools);
      return response.tools;
    } catch (error) {
      console.error("❌ Failed to list tools:", error);
      throw error;
    }
  }

  async listResources(): Promise<any[]> {
    try {
      const response = await this.client.listResources();
      console.log("📚 Available resources:", response.resources);
      return response.resources;
    } catch (error) {
      console.error("❌ Failed to list resources:", error);
      throw error;
    }
  }

  async callTool(name: string, args: any): Promise<any> {
    try {
      console.log(`🔧 Calling tool "${name}" with args:`, args);
      const response = await this.client.callTool({ name, arguments: args });
      console.log(`✅ Tool "${name}" response:`, response);
      return response;
    } catch (error) {
      console.error(`❌ Failed to call tool "${name}":`, error);
      throw error;
    }
  }

  async readResource(uri: string): Promise<any> {
    try {
      console.log(`📖 Reading resource: ${uri}`);
      const response = await this.client.readResource({ uri });
      console.log(`✅ Resource content:`, response);
      return response;
    } catch (error) {
      console.error(`❌ Failed to read resource "${uri}":`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.close();
      console.log("🔌 Disconnected from MCP server");
    } catch (error) {
      console.error("❌ Failed to disconnect:", error);
      throw error;
    }
  }

  getSessionId(): string | undefined {
    return this.transport.sessionId;
  }
}
