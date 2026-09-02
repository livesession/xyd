import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import { visit } from 'unist-util-visit';
import { describe, it, expect } from 'vitest';

import { mdComponentDirective } from '../mdComponentDirective';

async function directives(md: string) {
    const processor = unified()
        .use(remarkParse)
        .use(remarkDirective)
        .use(mdComponentDirective());

    const tree = processor.parse(md);
    await processor.run(tree);

    return tree;
}

function elements(tree: any, name: string) {
    const found: any[] = [];

    visit(tree, 'mdxJsxFlowElement', (node: any) => {
        if (node.name === name) {
            found.push(node);
        }
    });

    return found;
}

function text(node: any) {
    let value = '';

    visit(node, 'text', (child: any) => {
        value += child.value;
    });

    return value;
}

const tutorial = `:::::code-tutorial
1. Install the SDK

   Pick your package manager.

   ::::aside
   :::code-group{title="install"}
   \`\`\`bash npm
   npm i xyd-js
   \`\`\`
   :::

   :::callout
   Requires Node 22.12+.
   :::
   ::::

2. Run it
:::::
`;

describe('mdComponentDirective - code-tutorial', () => {
    it('turns each list item into a step with title, body and aside slots', async () => {
        const tree = await directives(tutorial);

        const [host] = elements(tree, 'CodeTutorialSteps');
        expect(host).toBeDefined();

        const steps = elements(tree, 'CodeTutorialSteps.Step');
        expect(steps).toHaveLength(2);

        const [first, second] = steps;

        expect(text(first.children[0])).toBe('Install the SDK');
        expect(first.children.map((slot: any) => slot.name)).toEqual([
            'CodeTutorialSteps.Title',
            'CodeTutorialSteps.Body',
            'CodeTutorialSteps.Aside',
        ]);

        // a step with nothing on the right gets no aside slot at all, which is what
        // the stylesheet keys off to give the prose the whole measure
        expect(second.children.map((slot: any) => slot.name)).toEqual([
            'CodeTutorialSteps.Title',
        ]);
    });

    it('converts container directives nested inside an aside', async () => {
        const tree = await directives(tutorial);

        const [aside] = elements(tree, 'CodeTutorialSteps.Aside');

        expect(aside.children.map((child: any) => child.name)).toEqual([
            'DirectiveCodeGroup',
            'Callout',
        ]);

        // the aside is a slot, not a component - nothing may survive as a raw directive
        const leftovers: string[] = [];
        visit(tree, 'containerDirective', (node: any) => {
            leftovers.push(node.name);
        });
        expect(leftovers).toEqual([]);
    });
});
