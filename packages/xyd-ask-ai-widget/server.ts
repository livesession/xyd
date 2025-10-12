import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import { handler as askAiHandler } from "@xyd-js/ask-ai/node";

if (!process.env.ASK_AI_URL) {
  throw new Error("ASK_AI_URL is not set");
}

// Start the server
async function startServer() {
  // Ensure widget is built before starting server
  await ensureWidgetBuilt();

  // Find an available port
  const port = await findAvailablePort(parseInt(process.env.PORT || "3500"));
  console.log(`🔍 Trying to start server on port ${port}...`);

  const server = Bun.serve({
    port,
    async fetch(request: Request) {
      const url = new URL(request.url);

      // Serve the widget bundle at /widget.js
      if (url.pathname === "/widget.js") {
        try {
          const widgetCode = widgetFile();

          return new Response(widgetCode, {
            headers: {
              "Content-Type": "application/javascript",
              "Cache-Control": "public, max-age=3600", // Cache for 1 hour
            },
          });
        } catch (error) {
          return new Response(
            "Widget not found. Please run 'bun run build' first.",
            {
              status: 404,
            }
          );
        }
      }

      // Handle ask AI requests at /ask
      if (url.pathname === "/ask") {
        return askAiHandler(request);
      }

      // Default response
      return new Response(
        "Xyd Ask AI Widget Server\n\nEndpoints:\n- GET /widget.js - Widget bundle\n- POST /ask - Ask AI endpoint",
        {
          headers: { "Content-Type": "text/plain" },
        }
      );
    },
  });

  console.log(`🚀 Widget server running at http://localhost:${server.port}`);
  console.log(`📦 Widget bundle: http://localhost:${server.port}/widget.js`);
  console.log(`🤖 Ask AI endpoint: http://localhost:${server.port}/ask`);
}

function widgetFile() {
  const widgetPath = join(process.cwd(), "dist", "widget.js");
  try {
    const widgetCode = readFileSync(widgetPath, "utf-8");
    return widgetCode;
  } catch (error) {
    return "";
  }
}
// Build widget using Bun's build API
async function buildWidget() {
  console.log("🔨 Building widget using Bun.build()...");

  const envs = {
    "process.env.NODE_ENV": '"production"',
    "process.env.ASK_AI_URL": `"${process.env.ASK_AI_URL}"`,
  };

  try {
    const result = await Bun.build({
      entrypoints: ["./widget.tsx"],
      outdir: "./dist",
      target: "browser",
      format: "iife",
      minify: true,
      sourcemap: "none",
      define: {
        ...envs,
      },
    });

    if (result.success) {
      console.log("✅ Widget built successfully");
    } else {
      console.error("❌ Widget build failed:", result.logs);
      throw new Error("Build failed");
    }
  } catch (error) {
    console.error("❌ Build error:", error);
    throw error;
  }
}

// Ensure widget is built
async function ensureWidgetBuilt() {
  const widgetPath = widgetFile();

  if (!existsSync(widgetPath)) {
    await buildWidget();
  } else {
    console.log("✅ Widget already built");
  }
}

// Find an available port
async function findAvailablePort(
  startPort: number = 3500,
  maxAttempts: number = 10
): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    try {
      const testServer = Bun.serve({
        port,
        fetch: () => new Response("test"),
      });
      testServer.stop();
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

// Start the server
startServer().catch(console.error);
