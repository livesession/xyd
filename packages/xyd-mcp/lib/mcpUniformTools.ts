import { toJsonObject } from "curlconverter";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";

import { uniformFromSource } from "./utils";

// TODO: sahre uniform with tools and resources

export async function mcpUniformTools(
  server: McpServer,
  uniformSource: string,
  token: string
) {
  const references = await uniformFromSource(uniformSource);

  if (!references?.length) {
    return;
  }

  for (const reference of references) {
    let code = "";
    if (reference?.examples?.groups?.length) {
      a: for (const group of reference.examples.groups) {
        for (const example of group.examples) {
          if (example.codeblock?.tabs) {
            for (const tab of example.codeblock.tabs) {
              if (tab.code && tab.language) {
                if (tab.language === "shell" && tab.code.startsWith("curl")) {
                  code = tab.code;
                  break a;
                }
              }
            }
          }
        }
      }
    }

    if (code) {
      const reqObj = toJsonObject(code);
      console.log(reqObj);
    }

    server.registerTool(
      reference.canonical,
      {
        description: reference.description as string,
        // inputSchema: null // TODO: support input schema
        // outputSchema: reference.outputSchema, // TODO: support output schema
      },
      async () => {
        return {
          content: [
            {
              type: "resource_link",
              uri: `api-reference://${reference.canonical}`,
              name: reference.canonical,
              description: reference.description as string,
              mimeType: "text/markdown",
            },
          ],
        };
      }
    );
  }
}
