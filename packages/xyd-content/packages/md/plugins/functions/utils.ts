import * as fs from 'node:fs';
import * as path from 'node:path';
import {VFile} from 'vfile';

import {Settings} from '@xyd-js/core';

/**
 * Common options for all function plugins
 */
export interface FunctionOptions {
    resolveFrom?: string;
}

/**
 * Parse a function call with arguments
 * @param node The AST node to parse
 * @param functionName The name of the function to look for
 */
export function parseFunctionCall<args = any>(node: any, functionName: string): [string, args] | null {
    function resp(args: any) {
        const response: any[] = []

        response.push(args[0])
        let jsonArgs = undefined;
        let argsString = args[1]
        if (argsString) {
            try {
                argsString = argsString
                    .replace(/'/g, '"')
                    .replace(/(\w+):/g, '"$1":');

                jsonArgs = JSON.parse(argsString);
                response.push(jsonArgs);
            } catch (e) {
            }
        }

        return response as [string, any];
    }

    // Check for the simple case with a single text node
    if (node.children && node.children.length === 1 && node.children[0].type === 'text') {
        const textNode = node.children[0];

        // Check for parentheses syntax with multiple arguments
        const parenthesesMatch = textNode.value.match(new RegExp(`^${functionName}\\((.*)\\)$`));
        if (parenthesesMatch) {
            const argsText = parenthesesMatch[1];
            // Split by comma and trim each argument
            const args = argsText.split(',').map((arg: string) => arg.trim().replace(/^["']|["']$/g, ''));
            // Return the first argument as the path

            return resp(args)
        }

        // Check for the original syntax
        const originalMatch = textNode.value.match(new RegExp(`^${functionName}\\s+['"](.*)['"]$`));
        if (originalMatch) {
            return resp([originalMatch[1], originalMatch[2]]);
        }
    }

    // Check for the complex case with multiple nodes
    if (!node || !node.children || node.children.length < 3) {
        return null;
    }

    // Check if the first node contains the function part
    const firstNode = node.children[0];
    const middleNode = node.children[1];
    const lastNode = node.children[2];

    if (firstNode.type === 'text' &&
        firstNode.value.startsWith(`${functionName} "`) &&
        middleNode.type === 'link' &&
        lastNode.type === 'text' &&
        lastNode.value === '"') {

        // We found a split command, extract the URL from the link node
        const url = middleNode.url;

        return resp([url]) // Create a match array with the URL in position 1
    }

    // Check for parentheses syntax with multiple arguments
    if (firstNode.type === 'text' &&
        firstNode.value.startsWith(`${functionName}(`) &&
        lastNode.type === 'text' &&
        lastNode.value === ')') {

        // Extract the arguments from the middle node
        if (middleNode.type === 'text') {
            // Simple case: all arguments in a single text node
            const argsText = middleNode.value;
            // Split by comma and trim each argument
            const args = argsText.split(',').map((arg: string) => arg.trim().replace(/^["']|["']$/g, ''));
            // Return the first argument as the path
            return resp(args);
        } else if (middleNode.type === 'link') {
            // Case with a link node (for URLs)
            const url = middleNode.url;
            return resp([url]);
        }
    }

    return null;
}

/**
 * Parse an import path to extract file path, regions, and line ranges
 */
export function parseImportPath(importPath: string): {
    filePath: string;
    regions: Region[];
    lineRanges: LineRange[]
} {
    // Initialize result
    const result = {
        filePath: importPath,
        regions: [] as Region[],
        lineRanges: [] as LineRange[]
    };

    // First, handle line ranges in the main path (not in regions)
    // Only match line ranges that contain numbers
    const mainLineRangeMatch = result.filePath.match(/\{([0-9,\s:-]+)\}/);
    if (mainLineRangeMatch) {
        const lineRangeStr = mainLineRangeMatch[1];
        result.filePath = result.filePath.replace(/\{[0-9,\s:-]+\}/, '');

        // Parse line ranges like "1,2-4, 8:, :10"
        const rangeParts = lineRangeStr.split(',').map(part => part.trim());

        for (const part of rangeParts) {
            if (part.includes('-')) {
                // Range like "2-4"
                const [start, end] = part.split('-').map(num => parseInt(num, 10));
                result.lineRanges.push({start, end});
            } else if (part.endsWith(':')) {
                // Range like "8:"
                const start = parseInt(part.replace(':', ''), 10);
                result.lineRanges.push({start});
            } else if (part.startsWith(':')) {
                // Range like ":10"
                const end = parseInt(part.replace(':', ''), 10);
                result.lineRanges.push({end});
            } else {
                // Single line like "1"
                const line = parseInt(part, 10);
                result.lineRanges.push({start: line, end: line});
            }
        }
    }

    // Then, handle regions
    const hashIndex = result.filePath.indexOf('#');
    if (hashIndex !== -1) {
        // Split the path at the hash
        const basePath = result.filePath.substring(0, hashIndex);
        const regionPart = result.filePath.substring(hashIndex + 1);

        // Update the file path
        result.filePath = basePath;

        // Check if the region part contains a numeric line range
        const regionLineRangeMatch = regionPart.match(/\{([0-9,\s:-]+)\}/);

        if (regionLineRangeMatch) {
            // If there are numeric line ranges in the region part, extract them
            const regionLineRangeStr = regionLineRangeMatch[1];
            const regionName = regionPart.replace(/\{[0-9,\s:-]+\}/, '').trim();

            // Parse the line ranges
            const rangeParts = regionLineRangeStr.split(',').map(part => part.trim());
            const regionLineRanges: LineRange[] = [];

            for (const part of rangeParts) {
                if (part.includes('-')) {
                    // Range like "2-4"
                    const [start, end] = part.split('-').map(num => parseInt(num, 10));
                    regionLineRanges.push({start, end});
                } else if (part.endsWith(':')) {
                    // Range like "8:"
                    const start = parseInt(part.replace(':', ''), 10);
                    regionLineRanges.push({start});
                } else if (part.startsWith(':')) {
                    // Range like ":10"
                    const end = parseInt(part.replace(':', ''), 10);
                    regionLineRanges.push({end});
                } else {
                    // Single line like "1"
                    const line = parseInt(part, 10);
                    regionLineRanges.push({start: line, end: line});
                }
            }

            // Add the region with its line ranges
            result.regions.push({name: regionName, lineRanges: regionLineRanges});
        } else {
            // If there are no numeric line ranges in the region part, check if it contains commas
            if (regionPart.includes(',')) {
                // Split by comma for multiple regions
                const regionNames = regionPart.split(',');
                for (const name of regionNames) {
                    result.regions.push({name: name.trim()});
                }
            } else {
                // Single region
                result.regions.push({name: regionPart.trim()});
            }
        }
    }

    return result;
}

/**
 * Process content based on regions and line ranges
 */
export function processContent(content: string, regions: Region[], lineRanges: LineRange[]): string {
    const lines = content.split('\n');

    // If no regions or line ranges specified, return the original content
    if (regions.length === 0 && lineRanges.length === 0) {
        return content;
    }

    // Process regions if present
    if (regions.length > 0) {
        const regionLines: string[] = [];

        for (const region of regions) {
            const regionStart = lines.findIndex(line => line.includes(`#region ${region.name}`));
            const regionEnd = lines.findIndex(line => line.includes(`#endregion ${region.name}`));

            if (regionStart !== -1 && regionEnd !== -1) {
                // Only include the content between region markers, not the markers themselves
                for (let i = regionStart + 1; i < regionEnd; i++) {
                    regionLines.push(lines[i]);
                }
            }
        }

        // If we found regions, return only the region content
        if (regionLines.length > 0) {
            return regionLines.join('\n');
        }
    }

    // Process line ranges if present
    if (lineRanges.length > 0) {
        // Create a set of line numbers to include
        const lineSet = new Set<number>();

        for (const range of lineRanges) {
            const start = range.start || 1;
            const end = range.end || lines.length;

            // Adjust for 0-based indexing
            const startIndex = Math.max(0, start - 1);
            const endIndex = Math.min(lines.length, end);

            for (let i = startIndex; i < endIndex; i++) {
                lineSet.add(i);
            }
        }

        // Filter lines based on the set
        const selectedLines = lines.filter((_, index) => lineSet.has(index));
        return selectedLines.join('\n');
    }

    return content;
}

// Map common extensions to languages
const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'jsx',
    'ts': 'typescript',
    'tsx': 'tsx',
    'py': 'python',
    'rb': 'ruby',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'cs': 'csharp',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'less': 'less',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'md': 'markdown',
    'mdx': 'mdx',
    'sh': 'bash',
    'bash': 'bash',
    'sql': 'sql',
    'graphql': 'graphql',
    'vue': 'vue',
    'svelte': 'svelte',
};

/**
 * Detect language from file extension
 */
export function detectLanguage(filePath: string): string {
    const extension = path.extname(filePath).toLowerCase().replace('.', '');

    return languageMap[extension] || path.extname(filePath).split('.').pop() || '';
}

/**
 * Read a local file
 */
export function readLocalFile(filePath: string, baseDir: string): string {
    // Handle "~/" prefix by replacing it with the current working directory
    if (filePath.startsWith('~/')) {
        filePath = filePath.replace('~/', process.cwd() + '/');
    }

    const fullPath = path.resolve(baseDir, filePath);
    return fs.readFileSync(fullPath, 'utf8');
}

/**
 * Fetch file content from a URL
 */
export async function fetchFileContent(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    return response.text();
}

/**
 * Interface for line range
 */
export interface LineRange {
    start?: number;
    end?: number;
}

/**
 * Interface for region
 */
export interface Region {
    name: string;
    lineRanges?: LineRange[];
}


export async function downloadContent(
    filePath: string,
    file: VFile,
    resolveFrom?: string,
) {
    const isExternal = filePath.startsWith('http://') || filePath.startsWith('https://');

    let content: string;

    if (isExternal) {
        // Fetch external content
        content = await fetchFileContent(filePath);
    } else {
        const baseDir = resolveFrom || (file.dirname || process.cwd());
        content = readLocalFile(filePath, baseDir);
    }

    return content;
}

export function functionMatch(value: string, functionName: string): boolean {
    return value.startsWith(functionName); // TODO: better function matching like args etc
}

/**
 * Resolves a path alias if the given path is an alias defined in the settings.
 * @param inputPath The path to resolve
 * @param settings The settings object containing path aliases
 * @param baseDir Optional base directory to resolve the final path from
 * @returns The resolved path or the original path if no alias is found
 */
export function resolvePathAlias(inputPath: string, settings?: Settings, baseDir?: string): string {
    if (!settings?.engine?.paths) {
        return inputPath;
    }

    // Find the longest matching alias
    let resolvedPath = inputPath;
    let longestMatch = '';

    for (const [alias, aliasPaths] of Object.entries(settings.engine.paths)) {
        // Convert alias pattern to regex, replacing * with .*
        const aliasPattern = alias.replace(/\*/g, '.*');
        const aliasRegex = new RegExp(`^${aliasPattern}`);

        if (aliasRegex.test(inputPath) && alias.length > longestMatch.length) {
            longestMatch = alias;
            // Replace the alias with the first path from the array
            const aliasPath = aliasPaths[0];
            // Replace * in the alias path with the matched part from the input path
            const matchedPart = inputPath.slice(alias.indexOf('*'));
            resolvedPath = aliasPath.replace(/\*/g, matchedPart);
        }
    }

    // If we found a match and have a base directory, resolve the path relative to it
    if (longestMatch && baseDir) {
        resolvedPath = path.resolve(baseDir, resolvedPath);
    }

    return resolvedPath;
}