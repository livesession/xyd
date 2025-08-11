import path from 'node:path';

import {describe, it, expect} from 'vitest';

import {mdFunctionInclude} from '../mdFunctionInclude';

import {createMockFile} from './testHelpers';

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
});