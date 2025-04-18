
import { visit } from 'unist-util-visit'

import { outputVars } from './lib'
import { outputVarsFromMarkdown, outputVarsToMarkdown } from './lib/util'

// TODO: as `>>>` symbol looks very well it conflicts with `blockquote` that why we need to handle such hacks

export function remarkOutputVars() {
    const data = this.data()

    const micromarkExtensions =
        data.micromarkExtensions || (data.micromarkExtensions = [])
    const fromMarkdownExtensions =
        data.fromMarkdownExtensions || (data.fromMarkdownExtensions = [])
    const toMarkdownExtensions =
        data.toMarkdownExtensions || (data.toMarkdownExtensions = [])

    micromarkExtensions.push(outputVars())
    fromMarkdownExtensions.push(outputVarsFromMarkdown())
    toMarkdownExtensions.push(outputVarsToMarkdown())


    return function() {}
    // disableBlockquote.call(this)
    // return function (tree) {
    //     restoreBlockquotes(tree)
    // }
}

function disableBlockquote() {
    const data = this.data();

    function add(field, value) {
        const list = data[field] || (data[field] = []);
        list.push(value);
    }

    add('micromarkExtensions', {
        disable: { null: ['blockQuote'] },
    });
}


function restoreBlockquotes(tree) {
    visit(tree, 'paragraph', (node, index, parent) => {
        // Check if this paragraph is a blockquote
        if (node.children && node.children.length === 1 &&
            node.children[0].type === 'text') {

            const text = node.children[0].value;
            // Match blockquotes with optional spaces between > characters
            const blockquoteMatch = text.match(/^(\s*>\s*)+/);

            if (blockquoteMatch) {
                // Count the number of > characters to determine nesting level
                const level = (blockquoteMatch[0].match(/>/g) || []).length;

                // Create nested blockquote nodes based on level
                let currentNode: any = {
                    type: 'blockquote',
                    children: [{
                        type: 'paragraph',
                        children: [{
                            type: 'text',
                            value: text.substring(blockquoteMatch[0].length)
                        }]
                    }]
                };

                // Create additional nested blockquotes if level > 1
                for (let i = 1; i < level; i++) {
                    currentNode = {
                        type: 'blockquote',
                        children: [currentNode]
                    };
                }

                // Replace the paragraph with the nested blockquote structure
                if (typeof index === 'number' && parent && parent.children) {
                    parent.children[index] = currentNode;
                }
            }
        }
    });
}
