import { visit } from 'unist-util-visit';
import { VFile } from 'vfile';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';

import { Settings } from '@xyd-js/core';

import { FunctionName } from './types';
import { FunctionOptions, parseFunctionCall, downloadContent, resolvePathAlias } from './utils';
import path from 'node:path';

interface ChangelogEntry {
    version: string;
    date?: string;
    content: string;
}

export function mdFunctionChangelog(settings?: Settings) {
    return function (options: FunctionOptions = {}) {
        return async function transformer(tree: any, file: VFile) {
            const promises: Promise<void>[] = [];

            visit(tree, 'paragraph', (node: any) => {
                if (!file?.dirname) {
                    return;
                }
                const result = parseFunctionCall(node, FunctionName.Changelog);
                if (!result || !result.length) return;

                const importPath = result[0];
                // let fullDirPath = path.join(process.cwd(), file.dirname || "")
                // fullDirPath = process.cwd()
                const resolvedPath = resolvePathAlias(importPath, settings, file) || importPath;

                const promise = (async () => {
                    try {
                        const content = await downloadContent(resolvedPath, file, options.resolveFrom);
                        const entries = parseChangelog(content);

                        // Replace the node with the generated content
                        node.type = 'mdxJsxFlowElement';
                        node.attributes = [];
                        node.children = entries.map(entry => {
                            // Parse the markdown content
                            const parsedContent = unified()
                                .use(remarkParse)
                                .use(remarkMdx)
                                .parse(entry.content);

                            return {
                                type: 'mdxJsxFlowElement',
                                name: 'Update',
                                attributes: [
                                    {
                                        type: 'mdxJsxAttribute',
                                        name: 'version',
                                        value: entry.version
                                    },
                                    {
                                        type: 'mdxJsxAttribute',
                                        name: 'date',
                                        value: entry.date || ''
                                    }
                                ],
                                children: parsedContent.children
                            };
                        });
                    } catch (error) {
                        console.error(`Error processing changelog: ${resolvedPath}`, error);
                    }
                })();

                promises.push(promise);
            });

            await Promise.all(promises);
        };
    };
}

function parseChangelog(content: string): ChangelogEntry[] {
    const entries: ChangelogEntry[] = [];
    const lines = content.split('\n');
    let currentEntry: ChangelogEntry | null = null;
    let currentContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Match different version header formats:
        // 1. ## [X.Y.Z] - any date format
        // 2. ## [X.Y.Z]
        // 3. ## X.Y.Z
        // 4. ## [unreleased] - any date format
        // 5. ## [0.0.1-alpha.0] - any date format
        const versionMatch = line.match(/^##\s+(?:\[?([^\]]+)\]?(?:\s*-\s*([^\n]+))?)/);
        if (versionMatch) {
            // Save previous entry if exists
            if (currentEntry) {
                currentEntry.content = currentContent.join('\n').trim();
                entries.push(currentEntry);
            }

            // Start new entry
            currentEntry = {
                version: versionMatch[1],
                date: versionMatch[2]?.trim() || '',
                content: ''
            };
            currentContent = [];
            continue;
        }

        // Skip the main title (# xyd-js)
        if (line.startsWith('# ')) {
            continue;
        }

        // Add content to current entry
        if (currentEntry) {
            currentContent.push(line);
        }
    }

    // Add last entry
    if (currentEntry) {
        currentEntry.content = currentContent.join('\n').trim();
        entries.push(currentEntry);
    }

    return entries;
}


