import { visit } from 'unist-util-visit';
import { VFile } from 'vfile';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { mdxjs } from 'micromark-extension-mdxjs';
import { mdxFromMarkdown } from 'mdast-util-mdx';

import { Settings } from '@xyd-js/core';

import { FunctionName } from './types';
import {
    FunctionOptions,
    parseFunctionCall,
    downloadContent,
    resolvePathAlias,
} from './utils';
import { defaultRemarkPlugins } from '..';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import { remarkMdxToc } from '../mdToc';
import path from 'path';

export function mdFunctionInclude(settings?: Settings) {
    return function (options: FunctionOptions = {}) {
        return async function transformer(tree: any, file: VFile) {
            console.time('plugin:mdFunctionInclude');

            // Collect all replacements to avoid index shifting issues
            const replacements: Array<{
                parent: any;
                index: number;
                children: any[];
            }> = [];

            // First pass: collect all @include nodes and their replacements
            const promises: Promise<void>[] = [];

            visit(tree, 'paragraph', (node: any, index: number | undefined, parent: any) => {
                const result = parseFunctionCall(node, FunctionName.Include);
                if (!result || index === undefined) return;

                const importPath = result[0];
                const resolvedPath =
                    resolvePathAlias(importPath, settings, file) || importPath;

                const promise = (async () => {
                    try {
                        const ext = resolvedPath.split('.').pop();
                        const content = await downloadContent(
                            resolvedPath,
                            file,
                            options.resolveFrom,
                        );

                        // Handle file path construction for both local and remote files
                        let includeFilePath: string;
                        let includeFileDirname: string;
                        
                        if (resolvedPath.startsWith('http://') || resolvedPath.startsWith('https://')) {
                            // For remote files, use the resolved path directly
                            includeFilePath = resolvedPath;
                            includeFileDirname = new URL(resolvedPath).pathname.replace(/\/[^\/]*$/, '');
                        } else {
                            // For local files, use the original logic
                            includeFilePath = path.join(file.dirname || "", resolvedPath);
                            includeFileDirname = path.dirname(includeFilePath);
                        }
                        
                        const includedFile = new VFile({
                            path: includeFilePath,
                            dirname: includeFileDirname,
                            value: content
                        });

                        let parsedTree;

                        const remarkPlugins = defaultRemarkPlugins({} as any, settings)
                            .filter(plugin => plugin !== remarkFrontmatter)
                            .filter(plugin => plugin !== remarkMdxFrontmatter)
                            .filter(plugin => !(typeof plugin === 'function' && (plugin.name === 'remarkMdxToc' || plugin.name === 'remarkMdxToc2')))
                            
                        if (ext === 'mdx') {
                            // Parse MDX into MDAST using micromark + mdast-util-mdx
                            parsedTree = fromMarkdown(content, {
                                extensions: [mdxjs()],
                                mdastExtensions: [mdxFromMarkdown()],
                            });

                            // Apply remark plugins to the parsed MDX tree with the correct file context
                            const mdxProcessor = unified().use(remarkPlugins);
                            parsedTree = await mdxProcessor.run(parsedTree, includedFile);
                        } else {
                            // Regular Markdown file using remarkParse
                            const processor = unified()
                                .use(remarkParse)
                                .use(remarkPlugins);

                            parsedTree = await processor.run(processor.parse(content), includedFile);
                        }

                        // Store the replacement instead of applying it immediately
                        replacements.push({
                            parent,
                            index,
                            children: parsedTree.children,
                        });
                    } catch (error) {
                        console.error(`Error including file: ${resolvedPath}`, error);
                    }
                })();

                promises.push(promise);
            });

            // Wait for all content to be downloaded and parsed
            await Promise.all(promises);

            // Second pass: apply replacements in reverse order to avoid index shifting
            replacements
                .sort((a, b) => b.index - a.index) // Sort by index in descending order
                .forEach(({ parent, index, children }) => {
                    parent.children.splice(index, 1, ...children);
                });

            console.timeEnd('plugin:mdFunctionInclude');
        };
    };
}
