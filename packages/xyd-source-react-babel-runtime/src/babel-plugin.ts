import type {PluginObj, types as BabelTypes} from '@babel/core';
import type {Reference} from '@xyd-js/uniform';

export interface XydUniformBabelPluginOptions {
    /**
     * Map of component name to its uniform Reference data.
     * The babel plugin looks up exported components by name and injects
     * `ComponentName.__xydUniform = JSON.parse('...')` after the declaration.
     */
    uniformMap: Record<string, Reference>;
}

function injectUniformAssignment(
    t: typeof BabelTypes,
    path: {insertAfter: (node: any) => void},
    componentName: string,
    ref: Reference,
) {
    const assignment = t.expressionStatement(
        t.assignmentExpression(
            '=',
            t.memberExpression(
                t.identifier(componentName),
                t.identifier('__xydUniform'),
            ),
            t.callExpression(
                t.memberExpression(
                    t.identifier('JSON'),
                    t.identifier('parse'),
                ),
                [t.stringLiteral(JSON.stringify(ref))],
            ),
        ),
    );

    path.insertAfter(assignment);
}

function getComponentNameFromDeclaration(
    t: typeof BabelTypes,
    declaration: any,
): string | undefined {
    if (t.isFunctionDeclaration(declaration) && declaration.id) {
        return declaration.id.name;
    }

    if (t.isVariableDeclaration(declaration)) {
        const declarator = declaration.declarations[0];
        if (declarator && t.isIdentifier(declarator.id)) {
            return declarator.id.name;
        }
    }

    return undefined;
}

function isPascalCase(name: string): boolean {
    return /^[A-Z]/.test(name);
}

export default function xydUniformBabelPlugin(
    {types: t}: {types: typeof BabelTypes},
    options: XydUniformBabelPluginOptions,
): PluginObj {
    const {uniformMap = {}} = options;

    return {
        name: 'xyd-uniform-babel-plugin',
        visitor: {
            ExportNamedDeclaration(path) {
                const declaration = path.node.declaration;
                if (!declaration) return;

                const componentName = getComponentNameFromDeclaration(t, declaration);
                if (!componentName || !isPascalCase(componentName)) return;

                const ref = uniformMap[componentName];
                if (!ref) return;

                injectUniformAssignment(t, path, componentName, ref);
            },

            ExportDefaultDeclaration(path) {
                const declaration = path.node.declaration;
                if (!declaration) return;

                let componentName: string | undefined;

                if (t.isFunctionDeclaration(declaration) && declaration.id) {
                    componentName = declaration.id.name;
                }

                if (!componentName || !isPascalCase(componentName)) return;

                const ref = uniformMap[componentName];
                if (!ref) return;

                injectUniformAssignment(t, path, componentName, ref);
            },
        },
    };
}
