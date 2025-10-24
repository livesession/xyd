import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkStringify from "remark-stringify";

export interface LLMsContent {
  content: string;
  links: string[];
  linkedContent: { [url: string]: string };
  metadata?: Record<string, any>;
}

/**
 * Parse llms.txt content using remark
 * Supports both string and string[] inputs for llms.txt paths
 */
export async function parseLLMsContent(
  llmsPaths: string | string[]
): Promise<LLMsContent[]> {
  const paths = Array.isArray(llmsPaths) ? llmsPaths : [llmsPaths];
  const results: LLMsContent[] = [];

  for (const llmsPath of paths) {
    try {
      // Validate URL
      if (!isUrl(llmsPath)) {
        throw new Error(`Invalid URL: ${llmsPath}`);
      }

      // Fetch content from URL
      const response = await fetch(llmsPath);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch ${llmsPath}: ${response.status} ${response.statusText}`
        );
      }
      const content = await response.text();
      const lastModified = new Date(
        response.headers.get("last-modified") || Date.now()
      );

      // Parse with remark
      const processor = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkStringify);

      const ast = processor.parse(content);
      const processedContent = processor.stringify(ast);

      // Extract links from the AST
      const links: string[] = [];
      extractLinks(ast, links);

      // Fetch content from all linked URLs in chunks
      const linkedContent: { [url: string]: string } = {};
      const validLinks = links.filter((link) => isUrl(link));

      if (validLinks.length > 0) {
        console.log("🔍 Starting to scrape linked content...");

        // Process links in chunks
        const chunkSize = 50;
        let processedCount = 0;

        for (let i = 0; i < validLinks.length; i += chunkSize) {
          const chunk = validLinks.slice(i, i + chunkSize);
          showLoader(llmsPath, processedCount, validLinks.length);

          const fetchPromises = chunk.map(async (link) => {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

              const linkResponse = await fetch(link, {
                signal: controller.signal,
              });

              clearTimeout(timeoutId);

              if (linkResponse.ok) {
                const linkContent = await linkResponse.text();
                return { link, content: linkContent };
              }
              return null;
            } catch (error) {
              console.warn(
                `Failed to fetch linked content from ${link}:`,
                error
              );
              return null;
            }
          });

          // Wait for this chunk to complete
          const results = await Promise.all(fetchPromises);

          // Process results from this chunk
          for (const result of results) {
            if (result) {
              linkedContent[result.link] = result.content;
            }
          }

          processedCount += chunk.length;
          showLoader(llmsPath, processedCount, validLinks.length);

          // Small delay between chunks to be respectful to servers
          if (i + chunkSize < validLinks.length) {
            await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay between chunks
          }
        }

        console.log(
          `\n✅ Scraping complete! Fetched ${Object.keys(linkedContent).length} pages`
        );
      }

      results.push({
        content: processedContent,
        links,
        linkedContent,
        metadata: {
          source: llmsPath,
          lastModified,
        },
      });
    } catch (error) {
      console.warn(`Failed to parse llms.txt at ${llmsPath}:`, error);
      // Continue with other files even if one fails
    }
  }

  return results;
}

/**
 * Check if a string is a valid URL
 */
function isUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract links from remark AST
 */
function extractLinks(node: any, links: string[]): void {
  if (node.type === "link" && node.url) {
    links.push(node.url);
  }

  if (node.children) {
    for (const child of node.children) {
      extractLinks(child, links);
    }
  }
}

// TODO: move to cli-spinner
// ASCII loader function
function showLoader(llmsPath: string, current: number, total: number) {
  const progress = Math.round((current / total) * 20);
  const bar = "█".repeat(progress) + "░".repeat(20 - progress);
  const percent = Math.round((current / total) * 100);
  process.stdout.write(
    `\r🔄 Scraping ${llmsPath}: [${bar}] ${percent}% (${current}/${total})`
  );
}
