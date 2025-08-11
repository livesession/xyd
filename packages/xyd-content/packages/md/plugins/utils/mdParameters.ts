export function mdParameters(
    text: string,
    options = {
        htmlMd: false,
    }
) {
    const attributes = parseAttributes(text, options.htmlMd);
    const props = parseProps(text, options.htmlMd);
    let sanitizedText = removeParameters(text);
    
    // Apply HTML to markdown transformation if requested
    if (options?.htmlMd) {
        sanitizedText = transformHtmlToMarkdown(sanitizedText);
    }
    
    return {
        attributes,
        props,
        sanitizedText
    }
}

function parseAttributes(text: string, htmlMd: boolean = false) {
    return parseParameters(text, '[', ']', htmlMd);
}

function parseProps(text: string, htmlMd: boolean = false) {
    return parseParameters(text, '{', '}', htmlMd);
}

function sanitizeParameters(value: string): string {
    // Convert escaped newlines to actual newlines
    value = value.replace(/\\n/g, '\n');

    // Remove any HTML tags
    value = value.replace(/<[^>]*>/g, '');

    // Remove any script tags and their content
    value = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove any potentially dangerous characters, but preserve newlines, :::component syntax, and markdown
    // Don't remove quotes, colons, or asterisks as they're needed for ::: components and markdown
    value = value.replace(/[<>]/g, '');

    // Remove any control characters except newlines (\n = \x0A)
    value = value.replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, '');

    // Ensure proper spacing around ::: components
    // Add newline before ::: if there isn't one already
    value = value.replace(/([^\n])\s*:::/g, '$1\n :::');

    // Auto-close ::: components if they're not already closed
    // Check if there's a ::: component that's not properly closed
    if (value.includes(':::')) {
        // Count the number of ::: occurrences
        const colonCount = (value.match(/:::/g) || []).length;
        
        // If we have an odd number of ::: components, we need to add a closing one
        if (colonCount % 2 === 1) {
            // Only add closing ::: if the string doesn't already end with it
            if (!value.trim().endsWith(':::')) {
                // Add newline before closing ::: if the string doesn't end with newline
                if (!value.endsWith('\n')) {
                    value = value + '\n';
                }
                value = value + ':::';
            }
        } else {
            // Even number of ::: components, but we need to ensure proper formatting
            // Look for patterns like "::: text" and convert to ":::\n text"
            // Handle both cases: "::: text" and ":::\n text"
            value = value.replace(/:::\s+([^\n]+)/g, ':::\n $1');
            // Also handle the case where there's already a newline but we need to ensure proper spacing
            value = value.replace(/:::\n\s*([^\n]+)/g, ':::\n $1');
            // Specific case: if we have ":::\n text", ensure it becomes ":::\n text"
            value = value.replace(/:::\n([^\n]+)/g, ':::\n $1');
        }
    }

    // Trim whitespace
    value = value.trim();

    return value;
}

function removeParameters(text: string): string {
    // Use a stack-based approach to handle nested brackets
    let result = '';
    let stack = 0;
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        // Handle quotes
        if ((char === '"' || char === "'") && !inQuotes) {
            inQuotes = true;
            quoteChar = char;
        } else if (char === quoteChar && inQuotes) {
            inQuotes = false;
            quoteChar = '';
        }
        
        // Only process brackets when not in quotes
        if (!inQuotes) {
            if (char === '[' || char === '{') {
                stack++;
            } else if (char === ']' || char === '}') {
                stack--;
            } else if (stack === 0) {
                result += char;
            }
        }
    }
    
    // Clean up multiple spaces and trim
    return result.replace(/\s+/g, ' ').trim();
}

function parseParameters(
    text: string,
    delimiter: string,
    closingDelimiter: string,
    htmlMd: boolean = false
) {
    const attributes: Record<string, string> = {};
    
    // Find all parameter blocks using stack-based approach
    const blocks = findNestedBlocks(text, delimiter, closingDelimiter);
    
    for (const blockContent of blocks) {
        // Then parse individual parameters within the block
        const paramRegex = /(!)?([^=\s]+)(?:=(?:"([^"]*)"|([^\s]*)))?/g;
        let paramMatch;
        
        while ((paramMatch = paramRegex.exec(blockContent)) !== null) {
            const [_, isNegated, prop, quotedValue, unquotedValue] = paramMatch;
            const value = quotedValue !== undefined ? quotedValue : unquotedValue;

            // Sanitize the property name
            let sanitizedParam = sanitizeParameters(prop);
            
            // Handle the value - apply HTML to markdown transformation first if requested
            let sanitizedValue: string;
            if (value) {
                if (htmlMd) {
                    // Apply HTML to markdown transformation first, then sanitize
                    sanitizedValue = sanitizeParameters(transformHtmlToMarkdown(value));
                } else {
                    sanitizedValue = sanitizeParameters(value);
                }
            } else {
                sanitizedValue = isNegated ? 'false' : 'true';
            }

            if (sanitizedParam.startsWith("#") && sanitizedValue === "true") {
                sanitizedValue = sanitizedParam.replace("#", "").trim()
                sanitizedParam = "id"
            }

            attributes[sanitizedParam] = sanitizedValue;
        }
    }

    return attributes;
}

function findNestedBlocks(text: string, openDelimiter: string, closeDelimiter: string): string[] {
    const blocks: string[] = [];
    let stack = 0;
    let startIndex = -1;
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        // Handle quotes
        if ((char === '"' || char === "'") && !inQuotes) {
            inQuotes = true;
            quoteChar = char;
        } else if (char === quoteChar && inQuotes) {
            inQuotes = false;
            quoteChar = '';
        }
        
        // Only process delimiters when not in quotes
        if (!inQuotes) {
            if (char === openDelimiter) {
                if (stack === 0) {
                    startIndex = i + 1; // +1 to skip the opening delimiter
                }
                stack++;
            } else if (char === closeDelimiter) {
                stack--;
                if (stack === 0 && startIndex !== -1) {
                    blocks.push(text.substring(startIndex, i));
                    startIndex = -1;
                }
            }
        }
    }
    
    return blocks;
}

function transformHtmlToMarkdown(text: string): string {
    // Transform common HTML tags to markdown
    return text
        // <code> tags to backticks
        .replace(/<code\b[^>]*>(.*?)<\/code>/gi, '`$1`')
        // <strong> and <b> tags to bold
        .replace(/<(strong|b)\b[^>]*>(.*?)<\/(strong|b)>/gi, '**$2**')
        // <em> and <i> tags to italic
        .replace(/<(em|i)\b[^>]*>(.*?)<\/(em|i)>/gi, '*$2*')
        // <a> tags to markdown links
        .replace(/<a\b[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)')
        // <br> tags to line breaks
        .replace(/<br\b[^>]*>/gi, '\n')
        // <p> tags to paragraphs (with line breaks)
        .replace(/<p\b[^>]*>(.*?)<\/p>/gi, '$1\n\n')
        // <h1> to <h6> tags to markdown headers
        .replace(/<h1\b[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
        .replace(/<h2\b[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
        .replace(/<h3\b[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
        .replace(/<h4\b[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
        .replace(/<h5\b[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
        .replace(/<h6\b[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
        // <ul> and <ol> lists
        .replace(/<ul\b[^>]*>(.*?)<\/ul>/gis, (match, content) => {
            return content.replace(/<li\b[^>]*>(.*?)<\/li>/gi, '- $1\n') + '\n';
        })
        .replace(/<ol\b[^>]*>(.*?)<\/ol>/gis, (match, content) => {
            let counter = 1;
            return content.replace(/<li\b[^>]*>(.*?)<\/li>/gi, () => `${counter++}. $1\n`) + '\n';
        })
        // <blockquote> tags
        .replace(/<blockquote\b[^>]*>(.*?)<\/blockquote>/gis, (match, content) => {
            return content.split('\n').map(line => `> ${line}`).join('\n') + '\n\n';
        })
        // <pre> tags for code blocks
        .replace(/<pre\b[^>]*>(.*?)<\/pre>/gis, '```\n$1\n```\n\n')
        // Remove any remaining HTML tags
        .replace(/<[^>]*>/g, '')
        // Clean up multiple line breaks
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
