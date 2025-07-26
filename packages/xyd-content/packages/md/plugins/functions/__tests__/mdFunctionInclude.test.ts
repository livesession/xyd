import path from 'node:path';

import { describe, it, expect } from 'vitest';

import { mdFunctionInclude } from '../mdFunctionInclude';

import { createMockFile } from './testHelpers';

describe('mdFunctionInclude', () => {
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

        // console.log(JSON.stringify(tree, null, 2));
        // The node should be transformed to a root type with children
        expect(tree.children[0].type).toBe('root');
        expect(tree.children[0].children).toBeDefined();
        expect(tree.children[0].children.length).toBeGreaterThan(0);
    });
});