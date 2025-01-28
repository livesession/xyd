import {Plugin} from 'unified';
import {Node as UnistNode} from 'unist';
import {visit} from 'unist-util-visit';

declare global {
    var page: boolean | null | undefined
}

export const extractPage: Plugin = () => {
    return (tree: UnistNode) => {
        visit(tree, 'exportNamedDeclaration', (node: any) => {
            const declaration = node.declaration;
            if (declaration && declaration.declarations) {
                declaration.declarations.forEach((decl: any) => {
                    if (decl.id.name === 'page') {
                        global.page = decl.init as boolean;
                    }
                });
            }
        });
    };
};