import { env } from "node:process";

import { askPrompt } from "./lib";

export interface Options {
    mcpUrl: string;
    aiProvider: string;
    aiModel: string;
    aiToken: string;
    corsHeaders?: Record<string, string>;
  }

export class Handler {
    private config: Options;
    private corsHeaders: Record<string, string>;
  
    constructor(config: Options) {
      this.config = config;
      this.corsHeaders = config.corsHeaders || {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      };
    }
  
    public static defaultConfig() {
      return {
        mcpUrl: env.MCP_URL || "",
        aiProvider: env.AI_PROVIDER || "",
        aiModel: env.AI_MODEL || "",
        aiToken: env.AI_TOKEN || "",
      }
    }
  
    public static New(config: Options) {
      const handler = new Handler(config);
  
      return (request: Request) => handler.handle(request);
    }
  
    public async handle(request: Request): Promise<Response> {
      // Handle preflight requests
      if (request.method === "OPTIONS") {
        return new Response("", {
          status: 200,
          headers: this.corsHeaders,
        });
      }
  

      if (request.method !== "POST") {
        return this.error(405, "Method not allowed");
      }
  
      try {
        const body = await request.json();
        const prompt = body.prompt;
  
        if (!prompt) {
          return this.error(400, "Missing prompt");
        }

        // TODO: !!! SOME ISSUES WITH ENV ON EDGE !!!
        const promptArgs = [
          this.config.mcpUrl || env.MCP_URL || "",
          this.config.aiProvider || env.AI_PROVIDER || "",
          this.config.aiModel || env.AI_MODEL || "",
          this.config.aiToken || env.AI_TOKEN || "",
          prompt
        ]

        const stream = await askPrompt(
          promptArgs[0],
          promptArgs[1],
          promptArgs[2],
          promptArgs[3],
          promptArgs[4]
        );

        const encoder = new TextEncoder();
        const readableStream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of stream) {
                controller.enqueue(encoder.encode(chunk));
              }
              controller.close();
            } catch (error) {
              controller.error(error);
            }
          },
        });
  
        return new Response(readableStream, {
          headers: {
            ...this.corsHeaders,
            "Content-Type": "text/plain; charset=utf-8",
            "Transfer-Encoding": "chunked",
          },
        });
      } catch (e) {
        const error = e as Error;
        console.error("Catch error:", error);
  
        return this.error(500, error.message);
      }
    }
  
    private error(status: number, message: string): Response {
      console.error("Error:", { status, message });
  
      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: {
          ...this.corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }
  }
  