export function mdParameters(text: string) {
    return {
        attributes: parseAttributes(text),
        props: parseProps(text),
        sanitizedText: removeParameters(text)
    }
}

function parseAttributes(text: string) {
    return parseParameters(text, '[', ']');
}

function parseProps(text: string) {
    return parseParameters(text, '{', '}');
}

function sanitizeParameters(value: string): string {
    // Remove any HTML tags
    value = value.replace(/<[^>]*>/g, '');

    // Remove any script tags and their content
    value = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove any potentially dangerous characters
    value = value.replace(/[<>'"]/g, '');

    // Remove any control characters
    value = value.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

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
    closingDelimiter: string
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

            // Sanitize both the property name and value
            let sanitizedParam = sanitizeParameters(prop);
            let sanitizedValue = value ? sanitizeParameters(value) : (isNegated ? 'false' : 'true');

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
