import {Plugin} from 'unified';
import {Node as UnistNode} from 'unist';
import {visit} from 'unist-util-visit';

interface ThemeSettings {
    bigArticle: boolean;
}

declare global {
    var themeSettings: ThemeSettings | undefined;
}

export const extractThemeSettings: Plugin = () => {
    return (tree: UnistNode) => {
        visit(tree, 'exportNamedDeclaration', (node: any) => {
            const declaration = node.declaration;
            if (declaration && declaration.declarations) {
                declaration.declarations.forEach((decl: any) => {
                    if (decl.id.name === 'themeSettings') {
                        global.themeSettings = decl.init as ThemeSettings;
                    }
                });
            }
        });
    };
};