import {visit} from 'unist-util-visit';

// This plugin transforms a custom container directive into a JSX node
// https://github.com/remarkjs/remark-directive is needed to parse the container directive

export function mdCodeGroup() {
    return (tree: any) => {
        visit(tree, 'containerDirective', (node) => {
            if (node.name !== 'code-group') return;

            const description = node.attributes?.title || '';
            const codeblocks = [];

            for (const child of node.children) {
                if (child.type === 'code') {
                    const meta = child.meta || '';
                    const value = child.value || '';
                    const lang = child.lang || '';

                    codeblocks.push({value, lang, meta});
                }
            }

            // Add metadata to the node
            node.data = {
                hName: 'DirectiveCodeSample',
                hProperties: {
                    description,
                    codeblocks: JSON.stringify(codeblocks),
                },
            };

            node.children = [];
        });
    };
}
