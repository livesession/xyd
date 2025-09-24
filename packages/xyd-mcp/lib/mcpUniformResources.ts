import path from "node:path";
import fs from "node:fs/promises";

import { highlight } from "codehike/code";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import syntaxThemeClassic from "@xyd-js/components/coder/themes/classic.js";

import { References } from "../References";
import { turndownService } from "./markdown";
import { uniformFromSource } from "./utils";
import { DefinitionProperty } from "@xyd-js/uniform";

export async function mcpUniformResources(
  server: McpServer,
  uniformSource: string
) {
  const references = await uniformFromSource(uniformSource);

  if (!references?.length) {
    return;
  }

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

  // TODO: maybe in the future
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
        console.warn(`Warning: Could not read CSS file ${filePath}:`, error);
        return "";
      }
    })
  );

  // TODO: to delete, only for testing
  // const referencesHtml = References({ references, cssContent });
  // await fs.writeFile(
  //   "./references.json",
  //   JSON.stringify(references, null, 2)
  // );
  // await fs.writeFile("./references.html", referencesHtml);
  // Convert to markdown with language detection
  // const md = turndownService.turndown(referencesHtml);
  // await fs.writeFile("./references.md", md);

  for (const reference of references) {
    const refHtml = References({ references: [reference], cssContent });
    const refMd = turndownService.turndown(refHtml);

    // TODO: custom naming ?
    const uri = `api-reference://${reference.canonical}`;
    const mimeType = "text/markdown";

    const fullName = `./output/${reference.canonical}.md`;
    const fullNameDir = path.dirname(fullName);

    try {
      await fs.access(fullName);
    } catch (e) {
      await fs.mkdir(fullNameDir, { recursive: true });
    }

    await fs.writeFile(`./output/${reference.canonical}.md`, refMd);
    await fs.writeFile(`./output/${reference.canonical}.html`, refHtml);
    await fs.writeFile(
      `./output/${reference.canonical}.json`,
      JSON.stringify(reference, null, 2)
    );

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

function uniformPropertiesToJsonSchema(
  properties: DefinitionProperty[] | DefinitionProperty
) {}
