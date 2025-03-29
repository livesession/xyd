import {Plugin} from 'unified';
import {Node as UnistNode} from 'unist';
import {visit} from 'unist-util-visit';

declare global {
    var page: boolean | null | undefined
}

/**
 * This plugin extracts the `page` variable from the markdown file.
 * This variable(`page`) is used to determine if theme should be dropped out.
 *
 * It means that if page=true, theme is not used, and we can use the markdown file as a standalone page.
 */
export const extractPage: Plugin = () => {
    return (tree: UnistNode) => {
        visit(tree, 'exportNamedDeclaration', (node: any) => {
            const declaration = node.declaration;

            if (!declaration || !declaration.declarations || !declaration.declarations.length) {
                return;
            }

            // seek declarations like export const page = true in md files
            declaration.declarations.forEach((decl: any) => {
                if (decl.id.name === 'page') {
                    global.page = decl.init as boolean;
                }
            });
        });
    };
};