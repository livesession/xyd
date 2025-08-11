import {unified} from 'unified';
import remarkParse from 'remark-parse';
import {visit} from 'unist-util-visit';
import {describe, it, expect} from 'vitest';

import {mdImage} from './mdImage';

describe('mdImage', () => {
    it('should parse caption attribute from image and attach to hProperties', async () => {
        const md = '![Alt text](/img.png){caption="Hello world"}';
        const processor = unified()
            .use(remarkParse)
            .use(mdImage);
        const tree = processor.parse(md);
        await processor.run(tree);
        let found = false;
        visit(tree, 'image', (node: any) => {
            found = true;
            expect(node.url).toBe('/img.png');
            expect(node.alt).toBe('Alt text');
            expect(node.data).toBeDefined();
            expect(node.data.hProperties).toBeDefined();
            expect(node.data.hProperties.caption).toBe('Hello world');
        });
        expect(found).toBe(true);
    });

    it('should work with multiple attributes', async () => {
        const md = '![Alt text](/img.png){caption="Hello world" style="border:1px solid red"}';
        const processor = unified()
            .use(remarkParse)
            .use(mdImage);
        const tree = processor.parse(md);
        await processor.run(tree);
        let found = false;
        visit(tree, 'image', (node: any) => {
            found = true;
            expect(node.data.hProperties.caption).toBe('Hello world');
            expect(node.data.hProperties.style).toBe('border:1px solid red');
        });
        expect(found).toBe(true);
    });

    it('should not fail if no attributes are present', async () => {
        const md = '![Alt text](/img.png)';
        const processor = unified()
            .use(remarkParse)
            .use(mdImage);
        const tree = processor.parse(md);
        await processor.run(tree);
        let found = false;
        visit(tree, 'image', (node: any) => {
            found = true;
            expect(node.alt).toBe('Alt text');
            expect(node.data?.hProperties?.caption).toBeUndefined();
        });
        expect(found).toBe(true);
    });
}); 