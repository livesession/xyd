import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

import { parseLLMsContent } from "./llms-parser";
import z from "zod";
// TODO: in the future
let vectorStore: MemoryVectorStore;

export async function mcpLLMsTools(
  server: McpServer,
  llmsSources: string | string[],
  embeddingToken: string
) {
  if (!vectorStore) {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: embeddingToken,
      model: "text-embedding-3-large",
    });
    vectorStore = new MemoryVectorStore(embeddings);
  }

  const llmsContents = await parseLLMsContent(llmsSources);
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  if (!llmsContents?.length) {
    return;
  }

  const docs: Document[] = [];
  for (const llmsContent of llmsContents) {
    for (const linkUrl of llmsContent.links) {
      const linkContent = llmsContent.linkedContent[linkUrl];

      docs.push(
        new Document({
          pageContent: linkContent,
          metadata: {
            llmTxtSource: llmsContent.metadata?.source,
            url: linkUrl,
          },
        })
      );
    }

     // Extract domain from the source URL and sanitize for tool name
     const domain = llmsContent.metadata?.source
       ? new URL(llmsContent.metadata.source).hostname.replace(/\./g, '-')
       : "docs";

     server.registerTool(
       `search_docs__${domain}`,
      {
        description: `
        Search documentation and content from ${domain}. 
        This tool allows you to find relevant information from the documentation, guides, and other content available on this domain.
        `,
        inputSchema: {
          query: z.string(),
        },
      },
      async (extra) => {
        const data = await vectorStore.similaritySearch(extra.query, 20);

        return {
          content: [
            //   {
            //     type: "resource_link",
            //     uri: `api-reference://${reference.canonical}`,
            //     name: reference.canonical,
            //     description: reference.description as string,
            //     mimeType: "text/markdown",
            //   },
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }
    );
  }

  const allSplits = await splitter.splitDocuments(docs);

  // Index chunks
  await vectorStore.addDocuments(allSplits);
}
