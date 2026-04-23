import * as path from 'node:path';
import * as fs from 'node:fs';
import type {Plugin} from 'vite';
import {jsonSchemaToUniformReference} from './json-schema-to-uniform';

export {jsonSchemaToUniformReference} from './json-schema-to-uniform';

export interface XydSourceReactRuntimeOptions {
    /** Path to tsconfig.json. Required for typia's TypeScript transform. */
    tsconfig?: string;
    /** Property name for the injected uniform data. Defaults to `__xydUniform`. */
    propertyName?: string;
}

interface ComponentInfo {
    name: string;
    propsType: string;
    fileName: string;
}

/**
 * Vite plugin that auto-detects React components, uses typia to generate
 * JSON Schema from their props at build time, and injects `__xydUniform`.
 *
 * No manual annotations needed — the plugin:
 * 1. Scans source files for exported functions with typed props
 * 2. Injects `typia.json.schemas<[PropsType]>()` calls
 * 3. Runs typia's TS transform to resolve all types (cross-file, generics, etc.)
 * 4. Converts JSON Schema → xyd uniform format
 * 5. Injects `Component.__xydUniform = JSON.parse('...')`
 *
 * ```ts
 * import react from '@vitejs/plugin-react';
 * import { xydSourceReactRuntime } from '@xyd-js/source-react-runtime';
 *
 * export default defineConfig({
 *   plugins: [
 *     xydSourceReactRuntime({ tsconfig: './tsconfig.json' }),
 *     react(),
 *   ],
 * });
 * ```
 */
export function xydSourceReactRuntime(options?: XydSourceReactRuntimeOptions): Plugin {
    // Map of fileName → typia-transformed output with __xydSchema injected
    let transformedFiles: Map<string, string> = new Map();
    const propName = options?.propertyName || '__xydUniform';

    return {
        name: 'xyd-source-react-runtime',
        enforce: 'pre',

        async buildStart() {
            const tsconfigPath = options?.tsconfig || path.resolve(process.cwd(), 'tsconfig.json');
            transformedFiles = await buildTypiaSchemas(tsconfigPath);
        },

        // Vite path: transform hook receives the original code
        transform(code, id) {
            if (!id.match(/\.[jt]sx?$/)) return null;

            const transformed = transformedFiles.get(path.resolve(id));
            if (!transformed) return null;

            return convertSchemaToUniform(transformed, propName);
        },

        // Rollup path: load hook returns our compiled JS before Rollup's parser
        load(id) {
            if (!id.match(/\.[jt]sx?$/)) return null;

            const transformed = transformedFiles.get(path.resolve(id));
            if (!transformed) return null;

            return convertSchemaToUniform(transformed, propName);
        },
    };
}

/**
 * Scans all source files, detects React components, injects typia calls,
 * and runs typia transform to generate JSON schemas.
 */
async function buildTypiaSchemas(tsconfigPath: string): Promise<Map<string, string>> {
    const result = new Map<string, string>();

    let ts: typeof import('typescript');
    let typiaTransformModule: any;

    try {
        ts = await import('typescript');
        typiaTransformModule = await import('typia/lib/transform');
    } catch {
        console.warn('[xyd-source-react-runtime] typia or typescript not found');
        return result;
    }

    const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
    const parsedConfig = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        path.dirname(tsconfigPath),
    );

    // Step 1: Scan source files for exported React components
    const componentsByFile = new Map<string, ComponentInfo[]>();

    for (const fileName of parsedConfig.fileNames) {
        const content = ts.sys.readFile(fileName);
        if (!content) continue;

        const components = detectComponents(ts, content, fileName);
        if (components.length > 0) {
            componentsByFile.set(fileName, components);
        }
    }

    if (componentsByFile.size === 0) return result;

    // Step 2: Create modified source files with typia calls injected
    const modifiedSources = new Map<string, string>();

    for (const [fileName, components] of componentsByFile) {
        // Filter out components whose propsType is an inline type literal with
        // React types (e.g. { children: React.ReactNode }) — typia can't resolve these
        const supported = components.filter(c => !c.propsType.includes('React.'));

        if (supported.length === 0) continue;

        const original = ts.sys.readFile(fileName)!;
        let modified = `import typia from "typia";\n${original}`;

        for (const comp of supported) {
            modified += `\n${comp.name}.__xydSchema = typia.json.schemas<[${comp.propsType}]>();`;
        }

        modifiedSources.set(fileName, modified);
    }

    // Step 3: Create a TS program with modified sources for typia transform
    const compilerHost = ts.createCompilerHost(parsedConfig.options);
    const origGetSourceFile = compilerHost.getSourceFile;
    const origFileExists = compilerHost.fileExists;
    const origReadFile = compilerHost.readFile;

    compilerHost.getSourceFile = (name, languageVersion, onError) => {
        const resolved = path.resolve(name);
        const modified = modifiedSources.get(resolved);
        if (modified) {
            return ts.createSourceFile(
                name, modified, languageVersion, true,
                name.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
            );
        }
        return origGetSourceFile.call(compilerHost, name, languageVersion, onError);
    };

    compilerHost.fileExists = (name) => {
        if (modifiedSources.has(path.resolve(name))) return true;
        return origFileExists.call(compilerHost, name);
    };

    compilerHost.readFile = (name) => {
        const modified = modifiedSources.get(path.resolve(name));
        if (modified) return modified;
        return origReadFile.call(compilerHost, name);
    };

    const program = ts.createProgram({
        rootNames: parsedConfig.fileNames,
        options: {...parsedConfig.options, noEmit: false, declaration: false, sourceMap: false},
        host: compilerHost,
    });

    const factory = (typiaTransformModule.default || typiaTransformModule)(program);

    // Step 4: Emit typia-transformed output for each file with components
    for (const fileName of componentsByFile.keys()) {
        const sourceFile = program.getSourceFile(fileName);
        if (!sourceFile) continue;

        try {
            let output = '';
            program.emit(
                sourceFile,
                (_name: string, text: string) => {
                    if (!_name.endsWith('.d.ts')) {
                        output = text;
                    }
                },
                undefined,
                false,
                {before: [factory]},
            );

            if (output) {
                result.set(path.resolve(fileName), output);
            }
        } catch (e) {
            // typia transform can fail on files with unresolvable types (e.g. React.ReactNode)
            // Skip these files — their components won't get __xydUniform
            console.warn(`[xyd-source-react-runtime] typia transform failed for ${fileName}, skipping`);
        }
    }

    return result;
}

/**
 * Detects exported React components and their props type names using TS AST.
 */
function detectComponents(
    ts: typeof import('typescript'),
    code: string,
    fileName: string,
): ComponentInfo[] {
    const sourceFile = ts.createSourceFile(
        fileName, code, ts.ScriptTarget.Latest, true,
        fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );

    const components: ComponentInfo[] = [];

    ts.forEachChild(sourceFile, (node) => {
        // export function ComponentName(props: PropsType) { ... }
        if (ts.isFunctionDeclaration(node) && node.name && isExported(ts, node)) {
            const name = node.name.text;
            if (!isPascalCase(name)) return;

            const propsType = extractPropsType(ts, node, sourceFile);
            if (propsType) {
                components.push({name, propsType, fileName});
            }
        }

        // export const ComponentName = (props: PropsType) => { ... }
        // export const SomeContext = createContext<ValueType>(...)
        if (ts.isVariableStatement(node) && isExported(ts, node)) {
            for (const decl of node.declarationList.declarations) {
                if (!ts.isIdentifier(decl.name)) continue;
                const name = decl.name.text;
                if (!isPascalCase(name)) continue;

                if (!decl.initializer) continue;

                // Arrow function / function expression → component
                if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
                    const propsType = extractPropsTypeFromParams(ts, decl.initializer.parameters, sourceFile);
                    if (propsType) {
                        components.push({name, propsType, fileName});
                    }
                    continue;
                }

                // createContext<T>(...) → context
                const contextType = extractCreateContextType(ts, decl.initializer, sourceFile);
                if (contextType) {
                    components.push({name, propsType: contextType, fileName});
                }
            }
        }
    });

    // Also detect non-inline exports: declarations + export { Name }
    // Collect all PascalCase declarations that weren't already found
    const foundNames = new Set(components.map(c => c.name));
    const reExportedNames = new Set<string>();

    // Find all names in export { ... } blocks
    ts.forEachChild(sourceFile, (node) => {
        if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
            for (const spec of node.exportClause.elements) {
                reExportedNames.add(spec.name.text);
            }
        }
    });

    // Find non-exported declarations that are re-exported
    ts.forEachChild(sourceFile, (node) => {
        // function Name(...) { ... } (not exported inline)
        if (ts.isFunctionDeclaration(node) && node.name && !isExported(ts, node)) {
            const name = node.name.text;
            if (!isPascalCase(name) || foundNames.has(name) || !reExportedNames.has(name)) return;

            const propsType = extractPropsType(ts, node, sourceFile);
            if (propsType) {
                components.push({name, propsType, fileName});
                foundNames.add(name);
            }
        }

        // const Name = createContext<T>(...) or const Name = (...) => { ... }
        if (ts.isVariableStatement(node) && !isExported(ts, node)) {
            for (const decl of node.declarationList.declarations) {
                if (!ts.isIdentifier(decl.name)) continue;
                const name = decl.name.text;
                if (!isPascalCase(name) || foundNames.has(name) || !reExportedNames.has(name)) continue;
                if (!decl.initializer) continue;

                // Arrow/function expression
                if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
                    const propsType = extractPropsTypeFromParams(ts, decl.initializer.parameters, sourceFile);
                    if (propsType) {
                        components.push({name, propsType, fileName});
                        foundNames.add(name);
                    }
                    continue;
                }

                // createContext<T>(...)
                const contextType = extractCreateContextType(ts, decl.initializer, sourceFile);
                if (contextType) {
                    components.push({name, propsType: contextType, fileName});
                    foundNames.add(name);
                }
            }
        }
    });

    return components;
}

/**
 * Extracts the type argument from createContext<T>() calls.
 * Handles: createContext<T | null>() → strips null from union, returns T.
 */
function extractCreateContextType(
    ts: typeof import('typescript'),
    initializer: import('typescript').Expression,
    sourceFile: import('typescript').SourceFile,
): string | null {
    if (!ts.isCallExpression(initializer)) return null;

    // Match createContext(...) or React.createContext(...)
    const callee = initializer.expression;
    const isCreateContext =
        (ts.isIdentifier(callee) && callee.text === 'createContext') ||
        (ts.isPropertyAccessExpression(callee) && callee.name.text === 'createContext');

    if (!isCreateContext) return null;

    // Get type arguments: createContext<T>(...)
    const typeArgs = initializer.typeArguments;
    if (!typeArgs || typeArgs.length === 0) return null;

    const typeArg = typeArgs[0];

    // If it's a union like T | null, strip null/undefined and return T
    if (ts.isUnionTypeNode(typeArg)) {
        const nonNullTypes = typeArg.types.filter(
            (t) => !(ts.isLiteralTypeNode(t) && t.literal.kind === ts.SyntaxKind.NullKeyword) &&
                   !(t.kind === ts.SyntaxKind.UndefinedKeyword),
        );
        if (nonNullTypes.length === 1) {
            return nonNullTypes[0].getText(sourceFile);
        }
        // Multiple non-null types — keep as union
        return nonNullTypes.map(t => t.getText(sourceFile)).join(' | ');
    }

    return typeArg.getText(sourceFile);
}

function isExported(ts: typeof import('typescript'), node: any): boolean {
    return node.modifiers?.some((m: any) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;
}

function isPascalCase(name: string): boolean {
    return /^[A-Z]/.test(name);
}

function extractPropsType(
    ts: typeof import('typescript'),
    node: import('typescript').FunctionDeclaration,
    sourceFile: import('typescript').SourceFile,
): string | null {
    return extractPropsTypeFromParams(ts, node.parameters, sourceFile);
}

function extractPropsTypeFromParams(
    ts: typeof import('typescript'),
    parameters: import('typescript').NodeArray<import('typescript').ParameterDeclaration>,
    sourceFile: import('typescript').SourceFile,
): string | null {
    if (parameters.length === 0) return null;

    const firstParam = parameters[0];

    // props: PropsType
    if (firstParam.type && ts.isTypeReferenceNode(firstParam.type)) {
        return firstParam.type.getText(sourceFile);
    }

    // { prop1, prop2 }: PropsType
    if (firstParam.type && ts.isTypeReferenceNode(firstParam.type) && ts.isObjectBindingPattern(firstParam.name)) {
        return firstParam.type.getText(sourceFile);
    }

    // Destructured with type annotation: ({ prop1, prop2 }: PropsType)
    if (ts.isObjectBindingPattern(firstParam.name) && firstParam.type) {
        return firstParam.type.getText(sourceFile);
    }

    return null;
}

/**
 * Finds __xydSchema assignments and converts JSON Schema → xyd uniform format.
 */
function convertSchemaToUniform(code: string, propertyName: string = '__xydUniform'): {code: string; map: null} | null {
    const schemaRegex = /(\w+)\.__xydSchema\s*=\s*(\{[\s\S]*?\n\});/g;
    let modified = code;
    let hasChanges = false;

    let match: RegExpExecArray | null;
    while ((match = schemaRegex.exec(code)) !== null) {
        const componentName = match[1];
        const schemaStr = match[2];

        try {
            const schema = new Function(`return ${schemaStr}`)();
            const uniform = jsonSchemaToUniformReference(componentName, schema);
            const jsonStr = JSON.stringify(uniform).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

            modified = modified.replace(
                match[0],
                `${componentName}.${propertyName} = JSON.parse('${jsonStr}');`,
            );
            hasChanges = true;
        } catch (e) {
            console.warn(`[xyd-source-react-runtime] Failed to parse schema for ${componentName}:`, e);
        }
    }

    if (!hasChanges) return null;
    return {code: modified, map: null};
}
