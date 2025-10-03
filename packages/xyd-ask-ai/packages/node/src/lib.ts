import {
  experimental_createMCPClient as createMCPClient,
  streamText,
  stepCountIs,
} from "ai";
import type { LanguageModel, experimental_MCPClient as MCPClient } from "ai";

import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";

let client: MCPClient;
let model: LanguageModel;

export async function askPrompt(
  mcpUrl: string,
  provider: string,
  modelId: string,
  token: string,
  prompt: string
) {
  try {
    if (!client) {
      // Alternatively, you can connect to a Server-Sent Events (SSE) MCP server:
      const sseTransport = new StreamableHTTPClientTransport(
        new URL(mcpUrl || "http://localhost:3000/mcp")
      );
      client = await createMCPClient({
        transport: sseTransport,
      });
    }

    if (!model) {
      switch (provider) {
        case "openai":
          const openai = createOpenAI({
            apiKey: token,
          });
          model = openai(modelId);
          break;
        case "anthropic":
          const anthropic = createAnthropic({
            apiKey: token,
          });
          model = anthropic(modelId);
          break;
        default:
          throw new Error("Invalid AI provider");
      }
    }

    const tools = await client.tools(); // TODO: cache tools too

    const response = await streamText({
      model,
      tools,
      stopWhen: stepCountIs(5),
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }],
        },
      ],
    });

    return response.textStream;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
