import {visit} from 'unist-util-visit';

const supportedComponentDirectives: { [key: string]: boolean } = {
    "table": true,
    "details": true,
    // "code-group": true, // TODO: replace in the future
}

/**
 * This plugin transforms a custom container directive into a JSX node
 */
export function mdComponentDirective() {
    return (tree: any) => {
        visit(tree, 'containerDirective', (node) => {
            const directiveName = node.name as string;
            if (!supportedComponentDirectives[directiveName]) {
                return
            }

            const codeblocks = [];

            for (const child of node.children) {
                if (child.type === 'code') {
                    const meta = child.meta || '';
                    const value = child.value || '';
                    const lang = child.lang || '';

                    codeblocks.push({value, lang, meta});
                }
            }

            // TODO: find better solution than json stringify?
            node.data = {
                hName: 'DirectiveComponent',
                hProperties: {
                    directiveName,
                    directiveProps: JSON.stringify(node.attributes),
                    codeProps: JSON.stringify({
                        codeblocks
                    }),
                },
            };

            node.children = [];
        });
    };
}
