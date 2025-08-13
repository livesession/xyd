import path from 'node:path';
import {VFile} from 'vfile';

import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';

import {mdFunctionInclude} from '../mdFunctionInclude';

import {createMockFile, createMockFetch, restoreFetch} from './testHelpers';

describe('mdFunctionInclude', () => {
    let originalFetch: typeof global.fetch;

    beforeEach(() => {
        originalFetch = global.fetch;
    });

    afterEach(() => {
        restoreFetch(originalFetch);
    });

    it('should transform @include statements to include markdown content', async () => {
        const transformer = mdFunctionInclude()();
        const tree = {
            type: 'root',
            children: [
                {
                    type: 'paragraph',
                    children: [
                        {
                            type: 'text',
                            value: '@include "test-include.md"'
                        }
                    ]
                }
            ]
        };
        const file = createMockFile();

        await transformer(tree, file);

        expect(tree.children.map(c => c.type)).toEqual([
                "heading",
                "paragraph",
                "heading",
                "list",
                "heading",
                "code",
                "heading",
                "list",
                "list",
                "mdxJsxFlowElement"
            ]
        );
    });

    it('should handle @include with relative paths when file is from remote URL', async () => {
        // Mock fetch responses for remote files
        const mockResponses = {
            'https://raw.githubusercontent.com/xyd-js/examples/refs/heads/master/abtesting/@snippets/installation.md': '# Installation\n\nInstall the package using npm.',
            'https://raw.githubusercontent.com/xyd-js/examples/refs/heads/master/abtesting/tutorial1.mdx': '# Tutorial 1\n\nThis is tutorial 1 content.'
        };
        
        createMockFetch(mockResponses);

        const transformer = mdFunctionInclude()();
        const tree = {
            type: 'root',
            children: [
                {
                    type: 'paragraph',
                    children: [
                        {
                            type: 'text',
                            value: '@include "@snippets/installation.md"'
                        }
                    ]
                },
                {
                    type: 'paragraph',
                    children: [
                        {
                            type: 'text',
                            value: '@include "./tutorial1.mdx"'
                        }
                    ]
                }
            ]
        };

        // Create a mock file with remote URL
        const remoteFile = new VFile({
            path: 'https://raw.githubusercontent.com/xyd-js/examples/refs/heads/master/abtesting/index.md',
            value: 'test content'
        });

        await transformer(tree, remoteFile);

        // Verify that the includes were processed and content was fetched
        expect(tree.children.length).toBeGreaterThan(2);
        
        // Check that the first include was processed (should have heading content)
        const firstIncludeResult = tree.children[0];
        expect(firstIncludeResult.type).toBe('heading');
        expect(firstIncludeResult.children[0].value).toBe('Installation');
        
        // Check that the second include was processed (should have heading content)
        const secondIncludeResult = tree.children[2];
        expect(secondIncludeResult.type).toBe('heading');
        expect(secondIncludeResult.children[0].value).toBe('Tutorial 1');
    });

    it('should handle @include with path aliases for remote URLs', async () => {
        // Mock fetch responses
        const mockResponses = {
            'https://raw.githubusercontent.com/xyd-js/examples/refs/heads/master/abtesting/snippets/installation.md': '# Installation\n\nInstall the package using npm.'
        };
        
        createMockFetch(mockResponses);

        const settings = {
            engine: {
                paths: {
                    '@snippets/*': ['https://raw.githubusercontent.com/xyd-js/examples/refs/heads/master/abtesting/snippets/*']
                }
            }
        };

        const transformer = mdFunctionInclude(settings)();
        const tree = {
            type: 'root',
            children: [
                {
                    type: 'paragraph',
                    children: [
                        {
                            type: 'text',
                            value: '@include "@snippets/installation.md"'
                        }
                    ]
                }
            ]
        };

        // Create a mock file with remote URL
        const remoteFile = new VFile({
            path: 'https://raw.githubusercontent.com/xyd-js/examples/refs/heads/master/abtesting/index.md',
            value: 'test content'
        });

        await transformer(tree, remoteFile);

        // Verify that the include was processed
        expect(tree.children.length).toBeGreaterThan(0);
        const includeResult = tree.children[0];
        expect(includeResult.type).toBe('heading');
        expect(includeResult.children[0].value).toBe('Installation');
    });

    it('should handle @include with relative paths when no path aliases are defined', async () => {
        // Mock fetch responses
        const mockResponses = {
            'https://raw.githubusercontent.com/xyd-js/examples/refs/heads/master/abtesting/@snippets/installation.md': '# Installation\n\nInstall the package using npm.'
        };
        
        createMockFetch(mockResponses);

        const transformer = mdFunctionInclude()(); // No settings, no path aliases
        const tree = {
            type: 'root',
            children: [
                {
                    type: 'paragraph',
                    children: [
                        {
                            type: 'text',
                            value: '@include "@snippets/installation.md"'
                        }
                    ]
                }
            ]
        };

        // Create a mock file with remote URL
        const remoteFile = new VFile({
            path: 'https://raw.githubusercontent.com/xyd-js/examples/refs/heads/master/abtesting/index.md',
            value: 'test content'
        });

        await transformer(tree, remoteFile);

        // Verify that the include was processed
        expect(tree.children.length).toBeGreaterThan(0);
        const includeResult = tree.children[0];
        expect(includeResult.type).toBe('heading');
        expect(includeResult.children[0].value).toBe('Installation');
    });
});