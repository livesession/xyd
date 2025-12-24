/**
 * Utility functions for parsing and managing YAML frontmatter in markdown files
 */

export interface ParsedMarkdown {
  frontmatter: string;
  content: string;
  hasFrontmatter: boolean;
}

/**
 * Parses markdown content and separates frontmatter from body
 * @param markdown - The full markdown content
 * @returns Object containing frontmatter, content, and a flag indicating if frontmatter exists
 */
export function parseFrontmatter(markdown: string): ParsedMarkdown {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);

  if (match) {
    return {
      frontmatter: match[1].trim(),
      content: match[2].trim(),
      hasFrontmatter: true,
    };
  }

  return {
    frontmatter: '',
    content: markdown,
    hasFrontmatter: false,
  };
}

/**
 * Combines frontmatter and content back into a single markdown string
 * @param frontmatter - The YAML frontmatter content (without --- delimiters)
 * @param content - The markdown body content
 * @returns Combined markdown string with frontmatter
 */
export function combineFrontmatter(frontmatter: string, content: string): string {
  if (!frontmatter || frontmatter.trim() === '') {
    return content;
  }

  return `---\n${frontmatter.trim()}\n---\n\n${content}`;
}

/**
 * Extracts custom code fence attributes from markdown
 * This preserves attributes like [!scroll descHead="..." desc="..."]
 */
export function preserveCodeFenceAttributes(markdown: string): {
  content: string;
  metadata: Map<number, string>;
} {
  const metadata = new Map<number, string>();
  let blockIndex = 0;

  // Match code fences with attributes
  const codeFenceRegex = /```(\w+)?\s*(\[.*?\])?\s*\n/g;

  const processedContent = markdown.replace(codeFenceRegex, (match, lang, attrs) => {
    if (attrs) {
      metadata.set(blockIndex, attrs);
    }
    blockIndex++;
    return match;
  });

  return {
    content: processedContent,
    metadata,
  };
}

/**
 * Restores code fence attributes to markdown content
 */
export function restoreCodeFenceAttributes(
  markdown: string,
  metadata: Map<number, string>
): string {
  let blockIndex = 0;
  const codeFenceRegex = /```(\w+)?\s*\n/g;

  return markdown.replace(codeFenceRegex, (match, lang) => {
    const attrs = metadata.get(blockIndex);
    blockIndex++;

    if (attrs) {
      return `\`\`\`${lang || ''} ${attrs}\n`;
    }
    return match;
  });
}
