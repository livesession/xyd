import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { highlight } from "codehike/code";
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { deferencedOpenAPI, oapSchemaToReferences } from "@xyd-js/openapi";
import { z } from "zod";

import prettier from "@prettier/sync";
import turndown from "turndown";

import syntaxThemeClassic from "@xyd-js/components/coder/themes/classic.js";

import { References } from "./References.tsx";

// TODO: better language detection
function detectLanguage(content) {
  // Check for shell/curl commands first
  if (
    content.includes("curl ") ||
    content.includes("--request") ||
    content.includes("bash") ||
    content.includes("sh ")
  ) {
    return "bash";
  }

  // Check for actual programming languages
  if (
    content.includes("interface ") ||
    content.includes(": string") ||
    content.includes(": number") ||
    content.includes("export ")
  ) {
    return "typescript";
  }
  if (
    content.includes("function ") ||
    content.includes("const ") ||
    content.includes("let ") ||
    content.includes("var ")
  ) {
    return "javascript";
  }
  if (content.trim().startsWith("{") && content.trim().endsWith("}")) {
    return "json";
  }
  if (
    content.includes("<") &&
    content.includes(">") &&
    (content.includes("html") || content.includes("div"))
  ) {
    return "html";
  }
  if (
    content.includes("{") &&
    (content.includes("color:") ||
      content.includes("margin:") ||
      content.includes("padding:"))
  ) {
    return "css";
  }
  return "text";
}

const remapLanguage = (language: string) => {
  if (language === "shellscript") {
    return "bash";
  }
  return language;
};

const turndownService = new turndown();
turndownService.addRule("strikethrough", {
  filter: ["pre"],
  replacement: function (content, node) {
    const explicitLang = node.getAttribute("data-lang");
    const language = remapLanguage(explicitLang || detectLanguage(content));

    // Format with Prettier only for supported programming languages
    let formattedContent = content;

    // Clean up bash/shell content
    if (language === "bash") {
      // Completely rebuild curl commands for clean formatting
      if (content.includes("curl")) {
        // Extract curl command parts
        let cleanContent = content
          .replace(/\\\\/g, "\\") // Fix double escaping
          .replace(/\\\-/g, "-") // Fix escaped dashes
          .replace(/\s+/g, " ") // Normalize all whitespace
          .trim();

        // Split by -- to get command parts
        const parts = cleanContent
          .split(/\s+--/)
          .map((part) => part.trim())
          .filter(Boolean);

        if (parts.length > 0) {
          // First part should contain 'curl'
          let curlPart = parts[0];
          if (!curlPart.startsWith("curl")) {
            curlPart = "curl " + curlPart;
          }

          // Rebuild with proper formatting
          const otherParts = parts.slice(1).map((part) => {
            // Fix header capitalization
            if (part.includes("header 'accept:")) {
              part = part.replace(/header 'accept:/gi, "header 'Accept:");
            }
            return "--" + part;
          });

          if (otherParts.length > 0) {
            formattedContent =
              curlPart + " \\\n  " + otherParts.join(" \\\n  ");
          } else {
            formattedContent = curlPart;
          }
        } else {
          formattedContent = cleanContent;
        }
      } else {
        // Non-curl bash content
        formattedContent = content
          .replace(/\\\\/g, "\\")
          .replace(/\\\-/g, "-")
          .replace(/\s+/g, " ")
          .trim();
      }
    } else {
      // Apply Prettier for programming languages
      try {
        const parserMap = {
          typescript: "typescript",
          javascript: "babel",
          json: "json",
          html: "html",
          css: "css",
        };

        const parser = parserMap[language];
        if (parser) {
          formattedContent = prettier.format(content, {
            parser,
            semi: true,
            singleQuote: false,
            tabWidth: 2,
          });
        }
      } catch (error) {
        console.warn(`Failed to format ${language} code:`, error);
      }
    }

    return `\`\`\`${language}\n${formattedContent}\n\`\`\``;
  },
});

// Handle individual properties with smart table headers and nested property support
turndownService.addRule("atlas-apiref-prop", {
  filter: ["atlas-apiref-prop"],
  replacement: function (content, node) {
    // Recursive function to process a prop and its nested props
    function processProp(n, parentName = "") {
      // Extract property name
      const propNameEl = n.querySelector("atlas-apiref-propname code");
      const propName = propNameEl ? propNameEl.textContent.trim() : "(unknown)";
      const fullName = parentName ? `${parentName}.${propName}` : propName;

      // Extract type
      const propTypeEl = n.querySelector("atlas-apiref-proptype code");
      const propType = propTypeEl ? propTypeEl.textContent.trim() : "";

      // Extract description
      const descEl = n.querySelector("atlas-apiref-propdescription");
      const description = descEl ? descEl.textContent.trim() : "";

      // Extract meta info (required/optional)
      const metaEl = n.querySelector("atlas-apiref-propmeta");
      const notes =
        metaEl?.getAttribute("data-name") === "required" &&
        metaEl?.getAttribute("data-value") === "true"
          ? "Required"
          : "Optional";

      // Add this property row
      let md = `| \`${fullName}\` | ${propType} | ${description} | ${notes} |\n`;

      // Recursively process nested props (inside div > ul)
      const nestedProps = n.querySelectorAll("div ul atlas-apiref-prop");
      nestedProps.forEach((child) => {
        md += processProp(child, fullName);
      });

      return md;
    }

    // Only add table header if this is the first property in the group
    const prevSibling = node.previousElementSibling;
    let result = "";
    if (!prevSibling || prevSibling.nodeName !== "ATLAS-APIREF-PROP") {
      result += "\n| Property | Type | Description | Notes |\n";
      result += "|----------|------|-------------|-------|\n";
    }

    // Process this node and any nested props
    result += processProp(node);

    return result;
  },
});

// Handle collapsed sections that contain nested properties
turndownService.addRule("collapsed-properties", {
  filter: function (node) {
    return (
      node.nodeName === "DIV" &&
      node.className &&
      node.className.includes("a1fjyrqx") &&
      node.querySelectorAll("atlas-apiref-prop").length > 0
    );
  },
  replacement: function (content, node) {
    // Process nested properties in collapsed sections
    // Return the content so turndown processes the nested elements
    return content;
  },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Handle POST requests for client-to-server communication
app.post("/mcp", async (req, res) => {
  // Check for existing session ID
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  console.log("sessionId", sessionId);
  if (sessionId && transports[sessionId]) {
    // Reuse existing transport
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
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
    // server.registerTool(
    //   "get_weather",
    //   {
    //     title: "Weather Tool",
    //     description: "Get weather information for a city",
    //     inputSchema: {
    //       city: z.string().describe("The city to get weather for"),
    //     },
    //   },
    //   async ({ city }) => {
    //     const weather = {
    //       city,
    //       temperature: Math.floor(Math.random() * 40) - 10,
    //       condition: ["sunny", "cloudy", "rainy", "snowy"][
    //         Math.floor(Math.random() * 4)
    //       ],
    //       humidity: Math.floor(Math.random() * 100),
    //     };
    //     return {
    //       content: [
    //         {
    //           type: "text",
    //           text: `Weather in ${city}: ${weather.temperature}°C, ${weather.condition}, ${weather.humidity}% humidity`,
    //         },
    //       ],
    //     };
    //   }
    // );

    // server.registerTool(
    //   "calculate",
    //   {
    //     title: "Calculator Tool",
    //     description: "Perform basic arithmetic calculations",
    //     inputSchema: {
    //       expression: z
    //         .string()
    //         .describe(
    //           "Mathematical expression to evaluate (e.g., '2 + 3 * 4')"
    //         ),
    //     },
    //   },
    //   async ({ expression }) => {
    //     try {
    //       const result = Function(`"use strict"; return (${expression})`)();
    //       return {
    //         content: [
    //           {
    //             type: "text",
    //             text: `Result: ${result}`,
    //           },
    //         ],
    //       };
    //     } catch (error: any) {
    //       return {
    //         content: [
    //           {
    //             type: "text",
    //             text: `Error: Invalid expression - ${error.message}`,
    //           },
    //         ],
    //       };
    //     }
    //   }
    // );

    // Register resources using the new API
    // server.registerResource(
    //   "getting-started",
    //   "xyd://docs/getting-started",
    //   {
    //     title: "Getting Started Guide",
    //     description: "Basic guide to get started with XYD",
    //     mimeType: "text/plain",
    //   },
    //   async () => ({
    //     contents: [
    //       {
    //         uri: "xyd://docs/getting-started",
    //         mimeType: "text/plain",
    //         text: "# Getting Started with XYD\n\n1. Install the CLI\n2. Initialize your project\n3. Add your first component\n4. Build and deploy",
    //       },
    //     ],
    //   })
    // );

    // server.registerResource(
    //   "status",
    //   "xyd://status",
    //   {
    //     title: "Server Status",
    //     description: "Current server status and metrics",
    //     mimeType: "application/json",
    //   },
    //   async () => ({
    //     contents: [
    //       {
    //         uri: "xyd://status",
    //         mimeType: "application/json",
    //         text: JSON.stringify(
    //           {
    //             status: "healthy",
    //             uptime: process.uptime(),
    //             memory: process.memoryUsage(),
    //             timestamp: new Date().toISOString(),
    //           },
    //           null,
    //           2
    //         ),
    //       },
    //     ],
    //   })
    // );

    const openApiSpec = await deferencedOpenAPI("./openapi.json" as string);
    if (openApiSpec) {
      const references = await oapSchemaToReferences(openApiSpec);

      for (const reference of references) {
        if (reference.examples) {
          for (const group of reference.examples.groups) {
            for (const example of group.examples) {
              if (example.codeblock?.tabs) {
                for (const tab of example.codeblock.tabs) {
                  if (tab.code && tab.language) {
                    try {
                      const highlighted = await highlight(
                        {
                          value: tab.code,
                          lang: tab.language,
                          meta: tab.title || "",
                        },
                        syntaxThemeClassic
                      );
                      tab.highlighted = highlighted;
                      console.log(
                        `Highlighted ${tab.language} code for ${reference.title || "unknown"}`
                      );
                    } catch (error) {
                      console.warn(
                        `Failed to highlight code for ${reference.title}:`,
                        error
                      );
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Read CSS file contents
      const cssFiles = [
        // TODO: temporary
        // path.resolve(__dirname, "../xyd-atlas/dist/tokens.css"),
        // path.resolve(__dirname, "../xyd-atlas/dist/index.css"),
        // path.resolve(__dirname, "../xyd-atlas/dist/styles.css"),
        // path.resolve(__dirname, "../xyd-components/dist/index.css"),
        // path.resolve(__dirname, "../xyd-theme-gusto/dist/index.css"),
      ];

      const cssContent = await Promise.all(
        cssFiles.map(async (filePath) => {
          try {
            return await fs.readFile(filePath, "utf-8");
          } catch (error) {
            console.warn(
              `Warning: Could not read CSS file ${filePath}:`,
              error
            );
            return "";
          }
        })
      );

      const referencesHtml = References({ references, cssContent });
      await fs.writeFile(
        "./references.json",
        JSON.stringify(references, null, 2)
      );
      await fs.writeFile("./references.html", referencesHtml);

      // Convert to markdown with language detection
      const md = turndownService.turndown(referencesHtml);
      await fs.writeFile("./references.md", md);

      console.log("CSS content inlined from files:", cssFiles);

      if (references?.length) {
        for (const reference of references) {
          const refHtml = References({ references: [reference], cssContent });
          const refMd = turndownService.turndown(refHtml);

          const uri = `xyd://api-reference/${reference.canonical}`;
          const mimeType = "text/markdown";

          server.registerResource(
            reference.canonical,
            uri,
            {
              title: reference.title,
              description: reference.description,
              mimeType,
            },
            async () => ({
              contents: [
                {
                  uri,
                  mimeType,
                  text: refMd,
                },
              ],
            })
          );

        }
      }
    }

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
