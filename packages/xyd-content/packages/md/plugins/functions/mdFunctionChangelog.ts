import { visit } from 'unist-util-visit';
import { VFile } from 'vfile';

import { FunctionName } from './types';
import { FunctionOptions, parseFunctionCall, downloadContent } from './utils';

interface ChangelogEntry {
    version: string;
    date?: string;
    content: string;
}

export function mdFunctionChangelog() {
    return function (options: FunctionOptions = {}) {
        return async function transformer(tree: any, file: VFile) {
            const promises: Promise<void>[] = [];

            visit(tree, 'paragraph', (node: any) => {
                const result = parseFunctionCall(node, FunctionName.Changelog);
                if (!result) return;

                const importPath = result[0];

                const promise = (async () => {
                    try {
                        const content = await downloadContent(importPath, file, options.resolveFrom);
                        const entries = parseChangelog(content);

                        console.log(entries, 333333);
                        // Create Update components for each entry
                        const updates = entries.map(createUpdateComponent).join('\n\n');

                        // Replace the node with the generated content
                        node.type = 'html';
                        node.value = updates;
                        node.children = undefined;
                    } catch (error) {
                        console.error(`Error processing changelog: ${importPath}`, error);
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

        // Match version headers (## X.Y.Z)
        const versionMatch = line.match(/^##\s+([\d.]+)/);
        if (versionMatch) {
            // Save previous entry if exists
            if (currentEntry) {
                currentEntry.content = currentContent.join('\n').trim();
                entries.push(currentEntry);
            }

            // Start new entry
            currentEntry = {
                version: versionMatch[1],
                content: ''
            };
            currentContent = [];
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

function createUpdateComponent(entry: ChangelogEntry): string {
    return `:::update{version="${entry.version}" date="${entry.date || ''}"}
${entry.content}
:::`;
}

