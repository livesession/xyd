import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { parseLLMsContent } from "./llms-parser";

export async function mcpLLMsResources(
  server: McpServer,
  llmsSources: string | string[]
) {
  if (!llmsSources) {
    return;
  }

  try {
    const llmsContents = await parseLLMsContent(llmsSources);
    
    for (const llmsContent of llmsContents) {
      // Register main llms.txt content
      const resourceName = `llms-${llmsContent.metadata?.source || 'content'}`.replace(/[^a-zA-Z0-9-_]/g, '-');
      const uri = `llms://${resourceName}`;
      
      server.registerResource(
        resourceName,
        uri,
        {
          title: `LLMs Content - ${llmsContent.metadata?.source || 'Unknown'}`,
          description: `Parsed llms.txt content with ${llmsContent.links.length} links`,
          mimeType: "text/markdown",
        },
        async () => ({
          contents: [
            {
              uri,
              mimeType: "text/markdown",
              text: llmsContent.content,
            },
          ],
        })
      );

      // Register each linked content as a separate resource
      for (const [linkUrl, linkContent] of Object.entries(llmsContent.linkedContent)) {
        const linkResourceName = `llms-link-${linkUrl}`.replace(/[^a-zA-Z0-9-_]/g, '-');
        const linkUri = `llms://${linkResourceName}`;
        
        server.registerResource(
          linkResourceName,
          linkUri,
          {
            title: `LLMs Link - ${linkUrl}`,
            description: `Content from linked URL: ${linkUrl}`,
            mimeType: "text/markdown",
          },
          async () => ({
            contents: [
              {
                uri: linkUri,
                mimeType: "text/markdown",
                text: linkContent,
              },
            ],
          })
        );
      }
    }
  } catch (error) {
    console.warn("Failed to add llms.txt resources:", error);
  }
}
