import fs from 'node:fs';
import path from 'node:path';

import { visit } from 'unist-util-visit';
import { VFile } from 'vfile';

import { FunctionName } from "./types";

interface ImportOptions {
    resolveFrom?: string;
}

interface LineRange {
    start?: number;
    end?: number;
}

interface Region {
    name: string;
    lineRanges?: LineRange[];
}

export function mdFunctionImportCode(options: ImportOptions = {}) {
    return async function transformer(tree: any, file: VFile) {
        // Collect promises for async operations
        const promises: Promise<void>[] = [];

        visit(tree, 'paragraph', (node: any) => {
            // First try the original approach - check if the entire command is in a single text node
            let importMatch = node.children?.[0]?.value?.match(new RegExp(`^${FunctionName.ImportCode}\\s+['"](.*)['"]$`));

            // If that didn't match, check if the command is split across multiple nodes
            if (!importMatch) {
                importMatch = linkCodeImport(node);
            }

            if (!importMatch) return;

            const importPath = importMatch[1];

            // Parse the import path to extract file path, regions, and line ranges
            const { filePath, regions, lineRanges } = parseImportPath(importPath);

            // Determine if this is a local or external file
            const isExternal = filePath.startsWith('http://') || filePath.startsWith('https://');

            // Create a promise for this node
            const promise = (async () => {
                try {
                    // Get the file content
                    let content: string;

                    if (isExternal) {
                        // Fetch external content
                        content = await fetchFileContent(filePath);
                    } else {
                        const baseDir = options.resolveFrom || (file.dirname || process.cwd());
                        content = readLocalFile(filePath, baseDir);
                    }

                    // Process the content based on regions and line ranges
                    let processedContent = processContent(content, regions, lineRanges);

                    // Detect language from file extension
                    const language = detectLanguage(filePath);

                    // Replace the paragraph with a code block
                    node.type = 'code';
                    node.lang = language;
                    node.value = processedContent;
                    node.children = undefined;

                } catch (error) {
                    console.error(`Error importing file: ${filePath}`, error);
                    // Keep the node as is if there's an error
                }
            })();

            // Add the promise to our collection
            promises.push(promise);
        });

        // Wait for all promises to resolve
        await Promise.all(promises);
    };
}

export function parseImportPath(importPath: string): {
    filePath: string;
    regions: Region[];
    lineRanges: LineRange[]
} {
    let filePath = importPath;
    const regions: Region[] = [];
    const lineRanges: LineRange[] = [];

    // Extract regions if present
    const regionMatch = filePath.match(/#([^\{]+)/);
    if (regionMatch) {
        const regionNames = regionMatch[1].split(',');
        filePath = filePath.replace(/#[^\{]+/, '');

        for (const name of regionNames) {
            regions.push({ name: name.trim() });
        }
    }

    // Extract line ranges if present
    const lineRangeMatch = filePath.match(/\{([^}]+)\}/);
    if (lineRangeMatch) {
        const lineRangeStr = lineRangeMatch[1];
        filePath = filePath.replace(/\{[^}]+\}/, '');

        // Parse line ranges like "1,2-4, 8:, :10"
        const rangeParts = lineRangeStr.split(',').map(part => part.trim());

        for (const part of rangeParts) {
            if (part.includes('-')) {
                // Range like "2-4"
                const [start, end] = part.split('-').map(num => parseInt(num, 10));
                lineRanges.push({ start, end });
            } else if (part.endsWith(':')) {
                // Range like "8:"
                const start = parseInt(part.replace(':', ''), 10);
                lineRanges.push({ start });
            } else if (part.startsWith(':')) {
                // Range like ":10"
                const end = parseInt(part.replace(':', ''), 10);
                lineRanges.push({ end });
            } else {
                // Single line like "1"
                const line = parseInt(part, 10);
                lineRanges.push({ start: line, end: line });
            }
        }
    }

    return { filePath, regions, lineRanges };
}

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

        console.log("333", lineSet, lines, lineRanges, regions)

        // Filter lines based on the set
        const selectedLines = lines.filter((_, index) => lineSet.has(index));
        return selectedLines.join('\n');
    }

    return content;
}

export function detectLanguage(filePath: string): string {
    const extension = path.extname(filePath).toLowerCase().replace('.', '');

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

    return languageMap[extension] || path.extname(filePath).split('.').pop() || '';
}

function readLocalFile(filePath: string, baseDir: string): string {
    console.log("readLocalFile", filePath, baseDir, process.cwd())
    
    // Handle "~/" prefix by replacing it with the current working directory
    if (filePath.startsWith('~/')) {
        filePath = filePath.replace('~/', process.cwd() + '/');
    }
    
    const fullPath = path.resolve(baseDir, filePath);
    return fs.readFileSync(fullPath, 'utf8');
}

async function fetchFileContent(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    return response.text();
}

function linkCodeImport(node: any) {
    if (!node || !node.children || node.children.length < 3) {
        return null;
    }

    // Check if the first node contains the @importCode part
    const firstNode = node.children[0];
    const middleNode = node.children[1];
    const lastNode = node.children[2];

    if (firstNode.type === 'text' &&
        firstNode.value.startsWith(`${FunctionName.ImportCode} "`) &&
        middleNode.type === 'link' &&
        lastNode.type === 'text' &&
        lastNode.value === '"') {

        // We found a split command, extract the URL from the link node
        const url = middleNode.url;

        return [null, url]; // Create a match array with the URL in position 1
    }

    return null;
}