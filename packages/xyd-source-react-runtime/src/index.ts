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

    // Step 3: Try emitting all components at once; on failure, retry per-component
    const emitResult = emitWithTypia(ts, parsedConfig, modifiedSources, typiaTransformModule, componentsByFile);

    for (const [fileName, output] of emitResult) {
        result.set(fileName, output);
    }

    // Step 4: For files that failed, retry each component individually
    // Lazily create a clean program (no typia) for type-checker fallback
    let cleanProgram: import('typescript').Program | null = null;

    for (const [fileName, components] of componentsByFile) {
        if (result.has(path.resolve(fileName))) continue;

        const supported = components.filter(c => !c.propsType.includes('React.'));
        if (supported.length === 0) continue;

        const original = ts.sys.readFile(fileName)!;
        let mergedOutput = '';

        for (const comp of supported) {
            const singleModified = new Map(modifiedSources);
            // Replace this file's modified source with one that only has this component's typia call
            const singleSource = `import typia from "typia";\n${original}\n${comp.name}.__xydSchema = typia.json.schemas<[${comp.propsType}]>();`;
            singleModified.set(fileName, singleSource);

            const singleResult = emitWithTypia(ts, parsedConfig, singleModified, typiaTransformModule, new Map([[fileName, [comp]]]));
            const singleOutput = singleResult.get(path.resolve(fileName));

            if (singleOutput) {
                // Extract the __xydSchema assignment line from successful output
                const schemaMatch = singleOutput.match(new RegExp(`${comp.name}\\.__xydSchema\\s*=\\s*\\{[\\s\\S]*?\\n\\};`));
                if (schemaMatch) {
                    if (!mergedOutput) {
                        // Use the first successful output as the base (it has the full compiled file)
                        mergedOutput = singleOutput;
                    } else {
                        // Append the schema assignment to the base output
                        mergedOutput += `\n${schemaMatch[0]}`;
                    }
                }
            } else {
                // Typia can't handle this component's props (e.g. React types) —
                // fall back to TS type checker to extract the schema manually
                if (!cleanProgram) {
                    cleanProgram = ts.createProgram({
                        rootNames: parsedConfig.fileNames,
                        options: {...parsedConfig.options, noEmit: false, declaration: false, sourceMap: false},
                    });
                }

                // Get base compiled output if we don't have one yet
                if (!mergedOutput) {
                    const sf = cleanProgram.getSourceFile(fileName);
                    if (sf) {
                        cleanProgram.emit(sf, (_name, text) => {
                            if (!_name.endsWith('.d.ts')) mergedOutput = text;
                        });
                    }
                }

                const schema = fallbackExtractSchema(ts, cleanProgram, fileName, comp);
                if (schema) {
                    const schemaStr = JSON.stringify(schema, null, 2);
                    mergedOutput += `\n${comp.name}.__xydSchema = ${schemaStr};`;
                } else {
                    console.warn(`[xyd-source-react-runtime] could not extract schema for ${comp.name} in ${fileName}, skipping component`);
                }
            }
        }

        if (mergedOutput) {
            result.set(path.resolve(fileName), mergedOutput);
        }
    }

    return result;
}

/**
 * Creates a TS program with modified sources and emits typia-transformed output.
 * Returns a map of resolved file paths to their transformed output.
 * Files that fail during transform are silently skipped (returns empty map for them).
 */
function emitWithTypia(
    ts: typeof import('typescript'),
    parsedConfig: import('typescript').ParsedCommandLine,
    modifiedSources: Map<string, string>,
    typiaTransformModule: any,
    componentsByFile: Map<string, ComponentInfo[]>,
): Map<string, string> {
    const result = new Map<string, string>();

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
        } catch {
            // Transform failed for this file — caller will handle retry
        }
    }

    return result;
}

/**
 * Fallback: uses the TS type checker to extract a JSON Schema from a component's
 * props type when typia can't handle it (e.g. props containing React.ReactNode).
 */
function fallbackExtractSchema(
    ts: typeof import('typescript'),
    program: import('typescript').Program,
    fileName: string,
    comp: ComponentInfo,
): Record<string, any> | null {
    const checker = program.getTypeChecker();
    const sourceFile = program.getSourceFile(fileName);
    if (!sourceFile) return null;

    let propsType: import('typescript').Type | undefined;

    const findPropsInNode = (node: import('typescript').Node) => {
        if (propsType) return;

        if (ts.isFunctionDeclaration(node) && node.name?.text === comp.name) {
            const param = node.parameters[0];
            if (param?.type) propsType = checker.getTypeAtLocation(param.type);
        }

        if (ts.isVariableStatement(node)) {
            for (const decl of node.declarationList.declarations) {
                if (!ts.isIdentifier(decl.name) || decl.name.text !== comp.name) continue;
                if (decl.initializer && (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))) {
                    const param = decl.initializer.parameters[0];
                    if (param?.type) propsType = checker.getTypeAtLocation(param.type);
                }
            }
        }
    };

    ts.forEachChild(sourceFile, findPropsInNode);
    if (!propsType) return null;

    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const symbol of checker.getPropertiesOfType(propsType)) {
        const name = symbol.getName();
        const memberType = checker.getTypeOfSymbolAtLocation(symbol, sourceFile);
        const description = ts.displayPartsToString(symbol.getDocumentationComment(checker));
        const isOptional = (symbol.flags & ts.SymbolFlags.Optional) !== 0;

        const schema = tsTypeToJsonSchema(ts, checker, memberType, sourceFile);
        if (description) schema.description = description;

        properties[name] = schema;
        if (!isOptional) required.push(name);
    }

    const rootSchema: any = { type: 'object', properties };
    if (required.length > 0) rootSchema.required = required;

    return {
        version: '3.1',
        components: { schemas: { [comp.propsType]: rootSchema } },
        schemas: [{ $ref: `#/components/schemas/${comp.propsType}` }],
    };
}

/**
 * Converts a TS type to a JSON Schema object using the type checker.
 * Handles primitives, string literal unions, arrays, and falls back to
 * { type: "object", description } for complex types (React, DOM, etc.).
 */
function tsTypeToJsonSchema(
    ts: typeof import('typescript'),
    checker: import('typescript').TypeChecker,
    type: import('typescript').Type,
    location: import('typescript').Node,
): any {
    const typeStr = checker.typeToString(type);

    if (type.flags & ts.TypeFlags.String) return {type: 'string'};
    if (type.flags & ts.TypeFlags.Number) return {type: 'number'};
    if (type.flags & (ts.TypeFlags.Boolean | ts.TypeFlags.BooleanLiteral)) return {type: 'boolean'};
    if (type.flags & ts.TypeFlags.Null) return {type: 'null'};
    if (type.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Void)) return {};
    if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) return {};

    if (type.isStringLiteral()) return {type: 'string', const: type.value};
    if (type.isNumberLiteral()) return {type: 'number', const: type.value};

    if (type.isUnion()) {
        const types = type.types.filter(t => !(t.flags & ts.TypeFlags.Undefined));
        // boolean is internally `true | false` — detect and collapse it
        if (types.length <= 2 && types.every(t => !!(t.flags & ts.TypeFlags.BooleanLiteral))) {
            return {type: 'boolean'};
        }
        if (types.every(t => t.isStringLiteral())) {
            return {
                oneOf: types.map(t => ({type: 'string', const: (t as import('typescript').StringLiteralType).value})),
            };
        }
        // Simple unions with only primitives/literals
        if (types.length <= 4 && types.every(t =>
            (t.flags & (ts.TypeFlags.String | ts.TypeFlags.Number | ts.TypeFlags.Boolean |
                ts.TypeFlags.BooleanLiteral | ts.TypeFlags.Null)) !== 0 ||
            t.isStringLiteral() || t.isNumberLiteral()
        )) {
            if (types.length === 1) return tsTypeToJsonSchema(ts, checker, types[0], location);
            return {oneOf: types.map(t => tsTypeToJsonSchema(ts, checker, t, location))};
        }
        return {type: typeStr};
    }

    // Simple array types
    if (typeStr === 'string[]') return {type: 'array', items: {type: 'string'}};
    if (typeStr === 'number[]') return {type: 'array', items: {type: 'number'}};
    if (typeStr === 'boolean[]') return {type: 'array', items: {type: 'boolean'}};
    if (typeStr.endsWith('[]') || typeStr.startsWith('Array<')) return {type: 'array'};

    // Function types — use the signature as the type
    const signatures = checker.getSignaturesOfType(type, ts.SignatureKind.Call);
    if (signatures.length > 0) return {type: typeStr};

    // Everything else — React types, DOM, Map, Set, Date, Record, etc.
    return {type: typeStr};
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
