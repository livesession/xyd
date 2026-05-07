import * as path from 'node:path';
import * as fs from 'node:fs';
import type {Plugin} from 'vite';

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
 * metadata from their props at build time, and injects `__xydUniform`.
 *
 * Uses `typia.reflect.schemas` for rich type metadata including functions,
 * native types (Date, Map, Set), and full object structures.
 */
export function xydSourceReactRuntime(options?: XydSourceReactRuntimeOptions): Plugin {
    let transformedFiles: Map<string, string> = new Map();
    const propName = options?.propertyName || '__xydUniform';
    // Map of componentName → uniform JSON string, collected from all successfully converted files
    let uniformCache: Map<string, string> = new Map();

    return {
        name: 'xyd-source-react-runtime',
        enforce: 'pre',

        async buildStart() {
            const tsconfigPath = options?.tsconfig || path.resolve(process.cwd(), 'tsconfig.json');
            transformedFiles = await buildTypiaSchemas(tsconfigPath);

            // Pre-compute uniform references for all files and cache by component name
            uniformCache = new Map();
            const typeResolver = (transformedFiles as any).__typeResolver;
            for (const [, code] of transformedFiles.entries()) {
                collectUniformCache(code, propName, typeResolver, uniformCache);
            }
        },

        transform(code, id) {
            if (!id.match(/\.[jt]sx?$/)) return null;
            const resolved = path.resolve(id);
            const transformed = transformedFiles.get(resolved);
            if (!transformed) return null;
            return convertSchemaToUniform(transformed, propName, (transformedFiles as any).__typeResolver, uniformCache);
        },

        load(id) {
            if (!id.match(/\.[jt]sx?$/)) return null;
            const resolved = path.resolve(id);
            const transformed = transformedFiles.get(resolved);
            if (!transformed) return null;
            return convertSchemaToUniform(transformed, propName, (transformedFiles as any).__typeResolver, uniformCache);
        },
    };
}

async function buildTypiaSchemas(tsconfigPath: string): Promise<any> {
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

    // Step 2: Create modified source files with typia.reflect.schemas calls
    const modifiedSources = new Map<string, string>();

    for (const [fileName, components] of componentsByFile) {
        const supported = components.filter(c => !c.propsType.includes('React.'));
        if (supported.length === 0) continue;

        const original = ts.sys.readFile(fileName)!;
        let modified = `import typia from "typia";\n${original}`;

        for (const comp of supported) {
            modified += `\n${comp.name}.__xydSchema = typia.reflect.schemas<[${comp.propsType}]>();`;
        }

        modifiedSources.set(fileName, modified);
    }

    // Step 3: Emit with typia transform
    const emitResult = emitWithTypia(ts, parsedConfig, modifiedSources, typiaTransformModule, componentsByFile);

    for (const [fileName, output] of emitResult) {
        result.set(fileName, output);
    }

    // Step 4: For components that failed or were filtered (React types), retry individually
    for (const [fileName, components] of componentsByFile) {
        const resolvedName = path.resolve(fileName);
        const existingOutput = result.get(resolvedName);

        const schemaObjPattern = (name: string) => new RegExp(`${name.replace(/\./g, '\\.')}\\.__xydSchema\\s*=\\s*\\{`);
        const missingComponents = existingOutput
            ? components.filter(c => !schemaObjPattern(c.name).test(existingOutput))
            : components;

        if (missingComponents.length === 0) continue;

        const original = ts.sys.readFile(fileName)!;
        let mergedOutput = existingOutput || '';

        for (const comp of missingComponents) {
            const hasReactTypes = comp.propsType.includes('React.');

            if (!hasReactTypes) {
                const singleModified = new Map(modifiedSources);
                const singleSource = `import typia from "typia";\n${original}\n${comp.name}.__xydSchema = typia.reflect.schemas<[${comp.propsType}]>();`;
                singleModified.set(fileName, singleSource);

                const singleResult = emitWithTypia(ts, parsedConfig, singleModified, typiaTransformModule, new Map([[fileName, [comp]]]));
                const singleOutput = singleResult.get(resolvedName);

                if (singleOutput) {
                    const schemaMatch = singleOutput.match(new RegExp(`${comp.name.replace(/\./g, '\\.')}\\.__xydSchema\\s*=\\s*\\{[\\s\\S]*?\\n\\};`));
                    if (schemaMatch) {
                        if (!mergedOutput) {
                            mergedOutput = singleOutput;
                        } else {
                            mergedOutput += `\n${schemaMatch[0]}`;
                        }
                        continue;
                    }
                }
            }

            // Minimal fallback for React-filtered types: use TS type checker for shallow schema
            const fallbackSchema = fallbackShallowSchema(ts, parsedConfig, fileName, comp);
            if (fallbackSchema) {
                if (!mergedOutput) {
                    // Need a base output — compile without typia
                    const cleanProgram = ts.createProgram({
                        rootNames: parsedConfig.fileNames,
                        options: {...parsedConfig.options, noEmit: false, declaration: false, sourceMap: false},
                    });
                    const sf = cleanProgram.getSourceFile(fileName);
                    if (sf) {
                        cleanProgram.emit(sf, (_name, text) => {
                            if (!_name.endsWith('.d.ts')) mergedOutput = text;
                        });
                    }
                }
                mergedOutput += `\n${comp.name}.__xydSchema = ${JSON.stringify(fallbackSchema, null, 2)};`;
            }
        }

        if (mergedOutput) {
            result.set(resolvedName, mergedOutput);
        }
    }

    // Step 5: Build a type resolver for unresolved "native" types that are actually user-defined
    const typeResolver = buildTypeResolver(ts, parsedConfig);

    // Attach resolver to result for use during conversion
    (result as any).__typeResolver = typeResolver;

    return result;
}

/**
 * Creates a function that resolves type names to their properties using the TS type checker.
 * Used to expand user-defined types that typia couldn't fully resolve (put in "natives").
 */
function buildTypeResolver(
    ts: typeof import('typescript'),
    parsedConfig: import('typescript').ParsedCommandLine,
): (typeName: string) => any[] | null {
    const BUILTIN_TYPES = new Set([
        'Date', 'RegExp', 'Error', 'URL', 'URLSearchParams',
        'Uint8Array', 'Int8Array', 'Float32Array', 'Float64Array',
        'ArrayBuffer', 'SharedArrayBuffer', 'DataView',
        'Promise', 'ReadableStream', 'WritableStream',
        'Blob', 'File', 'FormData', 'Headers', 'Request', 'Response',
        'Event', 'EventTarget', 'AbortController', 'AbortSignal',
        'WeakMap', 'WeakSet', 'WeakRef',
    ]);

    let program: import('typescript').Program | null = null;

    const resolver = (typeName: string): any[] | null => {
        // Skip known built-in types
        if (BUILTIN_TYPES.has(typeName)) return null;

        // Handle array suffix: "Tab[]" → recurse on "Tab", mark as array wrapper
        const arrayMatch = typeName.match(/^(.+)\[\]$/);
        if (arrayMatch) {
            const elementName = arrayMatch[1].trim();
            const elementProps = resolver(elementName);
            if (elementProps && elementProps.length > 0) {
                return [{
                    __wrapperKind: 'array',
                    __elementType: elementName,
                    __elementProperties: elementProps[0]?.__xor
                        ? elementProps.map((p: any) => ({name: p.name, type: p.type, description: p.description}))
                        : elementProps,
                    __elementIsXor: !!elementProps[0]?.__xor,
                }];
            }
            // Element type couldn't be resolved — emit array with primitive element
            return [{
                __wrapperKind: 'array',
                __elementType: elementName,
                __elementProperties: [],
                __elementIsXor: false,
            }];
        }

        // Strip "| null" or "| undefined" suffix → recurse on inner, mark nullable
        const nullableMatch = typeName.match(/^(.+?)\s*\|\s*(null|undefined)$/);
        if (nullableMatch) {
            const innerName = nullableMatch[1].trim();
            const innerProps = resolver(innerName);
            if (innerProps && innerProps.length > 0) {
                // If inner is a union wrapper, propagate variants directly
                if (innerProps[0]?.__wrapperKind === 'union') {
                    return [{
                        __wrapperKind: 'nullable',
                        __innerType: innerName,
                        __innerProperties: innerProps[0].__variants,
                        __innerWrapperKind: 'union',
                    }];
                }
                // First-variant wrapper: keep the variant name + props
                if (innerProps[0]?.__wrapperKind === 'firstVariant') {
                    return [{
                        __wrapperKind: 'nullable',
                        __innerType: innerName,
                        __innerVariantName: innerProps[0].__variantName,
                        __innerProperties: innerProps[0].__variantProps,
                        __innerWrapperKind: 'firstVariant',
                    }];
                }
                return [{
                    __wrapperKind: 'nullable',
                    __innerType: innerName,
                    __innerProperties: innerProps[0]?.__xor
                        ? innerProps.map((p: any) => ({name: p.name, type: p.type, description: p.description}))
                        : innerProps,
                    __innerIsXor: !!innerProps[0]?.__xor,
                }];
            }
            return null;
        }

        if (typeName.includes('<') || typeName.includes('.')) return null;
        if (/^[a-z]/.test(typeName)) return null; // primitive types

        if (!program) {
            program = ts.createProgram({
                rootNames: parsedConfig.fileNames,
                options: {...parsedConfig.options, noEmit: false, declaration: false, sourceMap: false},
            });
        }

        const checker = program.getTypeChecker();

        // Build a single property's DefinitionProperty by recursively resolving its type.
        // Handles: function signatures, string literal unions ($xor), arrays ($array),
        // nullable unions (T | null/undefined), and named user types (recurses).
        function buildNestedProperty(
            sym: import('typescript').Symbol,
            sourceFile: import('typescript').SourceFile,
            visitedNames: Set<string>,
        ): any {
            const memberType = checker.getTypeOfSymbolAtLocation(sym, sourceFile);
            const isOptional = (sym.flags & ts.SymbolFlags.Optional) !== 0;
            const description = ts.displayPartsToString(sym.getDocumentationComment(checker));
            const baseMeta = isOptional ? [] : [{name: 'required', value: 'true'}];
            const name = sym.getName();
            return resolveTypeIntoProperty(memberType, name, description, baseMeta, visitedNames, sourceFile);
        }

        // Resolve a TS type into a DefinitionProperty shape, recursing into named types.
        function resolveTypeIntoProperty(
            t: import('typescript').Type,
            name: string,
            description: string,
            meta: any[],
            visitedNames: Set<string>,
            sourceFile: import('typescript').SourceFile,
        ): any {
            // Function types
            const callSigs = t.getCallSignatures();
            if (callSigs.length > 0) {
                const sig = callSigs[0];
                const params = sig.getParameters().map(p => ({
                    name: p.getName(),
                    type: checker.typeToString(checker.getTypeOfSymbolAtLocation(p, sourceFile)),
                    description: '',
                    meta: [],
                }));
                const retType = checker.typeToString(sig.getReturnType());
                return {
                    name,
                    type: '$$function',
                    description: description || '',
                    properties: params,
                    ofProperty: {name: '', type: retType === 'void' ? 'void' : retType, description: '', meta: []},
                    meta,
                };
            }

            // Union types
            if (t.isUnion?.()) {
                const unionTypes = (t as any).types as import('typescript').Type[];

                // String literal union → $xor
                const allStringLiterals = unionTypes.every((u: any) => u.isStringLiteral?.());
                if (allStringLiterals && unionTypes.length > 1) {
                    return {
                        name,
                        type: '$xor',
                        description: description || '',
                        properties: unionTypes.map((u: any) => ({name: String(u.value), type: 'string', description: ''})),
                        meta,
                    };
                }

                // Nullable union: unwrap null/undefined → recurse on non-null
                const nonNull = unionTypes.filter((u: any) =>
                    !(u.flags & ts.TypeFlags.Null) && !(u.flags & ts.TypeFlags.Undefined),
                );
                if (nonNull.length === 1 && nonNull.length < unionTypes.length) {
                    const inner = resolveTypeIntoProperty(nonNull[0], name, description, meta, visitedNames, sourceFile);
                    if (!inner.meta.some((m: any) => m.name === 'nullable')) {
                        inner.meta = [...inner.meta, {name: 'nullable', value: 'true'}];
                    }
                    return inner;
                }

                // Discriminated union of named object types → use FIRST variant
                // (matches typia's behavior — easier for UIs to render than $$union)
                const allObjectLike = nonNull.every((u: any) =>
                    ((u.flags & ts.TypeFlags.Object) !== 0) || u.isClassOrInterface?.(),
                );
                if (!allStringLiterals && allObjectLike && nonNull.length > 1) {
                    const first = nonNull[0];
                    const variantName = checker.typeToString(first);
                    const variantProps = checker.getPropertiesOfType(first).map((sym: any) =>
                        buildNestedProperty(sym, sourceFile, new Set([...visitedNames, variantName])),
                    );
                    const result: any = {
                        name,
                        type: variantName,
                        description: description || '',
                        properties: variantProps,
                        meta,
                    };
                    if (nonNull.length < unionTypes.length) {
                        result.meta = [...meta, {name: 'nullable', value: 'true'}];
                    }
                    return result;
                }
            }

            // Array types: T[]
            if (checker.isArrayType?.(t)) {
                const elementType = (t as any).typeArguments?.[0] ?? (t as any).resolvedTypeArguments?.[0];
                if (elementType) {
                    const elProp = resolveTypeIntoProperty(elementType, '', '', [{name: 'required', value: 'true'}], visitedNames, sourceFile);
                    return {
                        name,
                        type: '$array',
                        description: description || '',
                        properties: [],
                        ofProperty: elProp,
                        meta,
                    };
                }
            }

            // Named object/interface types — recurse into properties
            const typeStr = checker.typeToString(t);
            const isObjectLike = !!(t.flags & ts.TypeFlags.Object) || !!t.isClassOrInterface?.();
            const looksLikeNamedUserType = isObjectLike
                && /^[A-Z]/.test(typeStr)
                && !typeStr.includes('{')
                && !typeStr.startsWith('Array<')
                && !typeStr.includes('=>');

            if (looksLikeNamedUserType && !visitedNames.has(typeStr)) {
                const subProps = checker.getPropertiesOfType(t);
                if (subProps.length > 0) {
                    const newVisited = new Set(visitedNames).add(typeStr);
                    return {
                        name,
                        type: typeStr,
                        description: description || '',
                        properties: subProps.map(s => buildNestedProperty(s, sourceFile, newVisited)),
                        meta,
                    };
                }
            }

            // Fallback — primitive or unrecognized
            return {
                name,
                type: typeStr,
                description: description || '',
                meta,
            };
        }

        // Recursively search for types inside namespace/module declarations
        function findTypeInNode(node: import('typescript').Node): import('typescript').Type | undefined {
            let found: import('typescript').Type | undefined;
            ts.forEachChild(node, (child) => {
                if (found) return;
                if (ts.isInterfaceDeclaration(child) && child.name.text === typeName) {
                    found = checker.getTypeAtLocation(child);
                } else if (ts.isTypeAliasDeclaration(child) && child.name.text === typeName) {
                    found = checker.getTypeAtLocation(child);
                } else if (ts.isModuleDeclaration(child) && child.body) {
                    // Walk into namespaces
                    if (ts.isModuleBlock(child.body)) {
                        found = findTypeInNode(child.body);
                    } else if (ts.isModuleDeclaration(child.body)) {
                        found = findTypeInNode(child.body);
                    }
                }
            });
            return found;
        }

        // Search for the type in all source files
        for (const sourceFile of program.getSourceFiles()) {
            if (sourceFile.isDeclarationFile) continue;

            const foundType = findTypeInNode(sourceFile);

            if (foundType) {
                // Detect unions
                if (foundType.isUnion()) {
                    const unionTypes = (foundType as any).types as import('typescript').Type[];
                    const allStringLiterals = unionTypes.every((t: any) => t.isStringLiteral?.());

                    // Discriminated union of named object types → use FIRST variant
                    // (matches typia's behavior — easier for UIs to render than a union)
                    const allObjectLike = unionTypes.every((t: any) =>
                        ((t.flags & ts.TypeFlags.Object) !== 0) || t.isClassOrInterface?.(),
                    );
                    if (!allStringLiterals && allObjectLike && unionTypes.length > 1) {
                        const first = unionTypes[0];
                        const variantName = checker.typeToString(first);
                        const variantProps = checker.getPropertiesOfType(first).map((sym: any) =>
                            buildNestedProperty(sym, sourceFile, new Set([typeName, variantName])),
                        );
                        return [{__wrapperKind: 'firstVariant', __variantName: variantName, __variantProps: variantProps}];
                    }

                    if (allStringLiterals && unionTypes.length > 1) {
                        return unionTypes.map((t: any) => ({
                            name: String(t.value),
                            type: 'string',
                            description: '',
                            __xor: true, // signal to resolveMetadataType to use $xor
                        }));
                    }
                }

                const properties = checker.getPropertiesOfType(foundType);
                if (properties.length === 0) return null;

                return properties.map(sym => buildNestedProperty(sym, sourceFile, new Set([typeName])));
            }
        }

        return null;
    };
    return resolver;
}

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
        options: {...parsedConfig.options, noEmit: false, declaration: false, sourceMap: false, strict: true},
        host: compilerHost,
    });

    const extras = {
        addDiagnostic: (_diag: import('typescript').Diagnostic) => {},
    };
    const factory = (typiaTransformModule.default || typiaTransformModule)(program, undefined, extras);

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
            // Transform failed — caller will handle retry
        }
    }

    return result;
}

/**
 * Minimal fallback for components whose propsType contains React types.
 * Uses TS type checker to extract shallow property info (type names only, no recursion into built-ins).
 */
function fallbackShallowSchema(
    ts: typeof import('typescript'),
    parsedConfig: import('typescript').ParsedCommandLine,
    fileName: string,
    comp: ComponentInfo,
): any | null {
    const program = ts.createProgram({
        rootNames: parsedConfig.fileNames,
        options: {...parsedConfig.options, noEmit: false, declaration: false, sourceMap: false},
    });
    const checker = program.getTypeChecker();
    const sourceFile = program.getSourceFile(fileName);
    if (!sourceFile) return null;

    let propsType: import('typescript').Type | undefined;

    // For namespaced names like "composer.chat.Context", split and walk into namespaces
    const nameParts = comp.name.split('.');
    const leafName = nameParts[nameParts.length - 1];
    const nsParts = nameParts.slice(0, -1); // namespace path to walk into

    function findInBody(body: import('typescript').Node) {
        ts.forEachChild(body, (node) => {
            if (propsType) return;
            if (ts.isFunctionDeclaration(node) && node.name?.text === leafName) {
                const param = node.parameters[0];
                if (param?.type) propsType = checker.getTypeAtLocation(param.type);
            }
            if (ts.isVariableStatement(node)) {
                for (const decl of node.declarationList.declarations) {
                    if (!ts.isIdentifier(decl.name) || decl.name.text !== leafName) continue;
                    if (decl.initializer && (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))) {
                        const param = decl.initializer.parameters[0];
                        if (param?.type) propsType = checker.getTypeAtLocation(param.type);
                    }
                    // createContext
                    if (decl.initializer && ts.isCallExpression(decl.initializer)) {
                        const callee = decl.initializer.expression;
                        const isCreateContext =
                            (ts.isIdentifier(callee) && callee.text === 'createContext') ||
                            (ts.isPropertyAccessExpression(callee) && callee.name.text === 'createContext');
                        if (isCreateContext && decl.initializer.typeArguments?.[0]) {
                            propsType = checker.getTypeAtLocation(decl.initializer.typeArguments[0]);
                        }
                    }
                }
            }
        });
    }

    if (nsParts.length === 0) {
        // Top-level — search directly
        findInBody(sourceFile);
    } else {
        // Walk into nested namespaces.
        // TS may split `namespace a.b { ... }` into multiple ModuleDeclarations with the
        // same name "a". One has a ModuleBlock body (for `namespace a { types }`), another
        // has a nested ModuleDeclaration body (for `namespace a.b { context }`).
        // We must try ALL matching declarations to find the right path.
        let currentBody: import('typescript').Node = sourceFile;
        let walkSuccess = false;

        function walkNsParts(body: import('typescript').Node, partIndex: number): boolean {
            if (partIndex >= nsParts.length) {
                // Unwrap final ModuleDeclaration → ModuleBlock if needed
                if (ts.isModuleDeclaration(body) && (body as any).body) {
                    const inner = (body as any).body;
                    if (ts.isModuleBlock(inner)) { currentBody = inner; return true; }
                }
                currentBody = body;
                return true;
            }

            const nsPart = nsParts[partIndex];

            // If body itself IS the target ModuleDeclaration (from dotted namespace unwrapping)
            if (ts.isModuleDeclaration(body) && (body as any).name?.text === nsPart) {
                if ((body as any).body) {
                    if (ts.isModuleBlock((body as any).body)) {
                        if (partIndex === nsParts.length - 1) { currentBody = (body as any).body; return true; }
                        return walkNsParts((body as any).body, partIndex + 1);
                    } else if (ts.isModuleDeclaration((body as any).body)) {
                        return walkNsParts((body as any).body, partIndex + 1);
                    }
                }
                return false;
            }

            let found = false;
            ts.forEachChild(body, (node) => {
                if (found) return;
                if (ts.isModuleDeclaration(node) && node.name.text === nsPart && node.body) {
                    if (ts.isModuleBlock(node.body)) {
                        if (partIndex === nsParts.length - 1) {
                            currentBody = node.body;
                            found = true;
                        } else if (walkNsParts(node.body, partIndex + 1)) {
                            found = true;
                        }
                    } else if (ts.isModuleDeclaration(node.body)) {
                        if (walkNsParts(node.body, partIndex + 1)) {
                            found = true;
                        }
                    }
                }
            });
            return found;
        }

        walkSuccess = walkNsParts(sourceFile, 0);
        if (!walkSuccess) currentBody = sourceFile; // fallback to top-level

        findInBody(currentBody);
    }

    if (!propsType) return null;

    // Strip null/undefined from union: `Foo | null` → `Foo` so we can read properties
    if (propsType.isUnion?.()) {
        const nonNull = (propsType as any).types.filter((t: any) =>
            !(t.flags & ts.TypeFlags.Null) && !(t.flags & ts.TypeFlags.Undefined),
        );
        if (nonNull.length === 1) {
            propsType = nonNull[0];
        }
    }

    // Helper to build an empty typia value-shape with one field populated
    const emptyValueShape = (overrides: any) => ({
        atomics: [], constants: [], required: true, optional: false, nullable: false, any: false,
        functions: [], templates: [], escaped: null, rest: null,
        arrays: [], tuples: [], objects: [], aliases: [], natives: [], sets: [], maps: [],
        ...overrides,
    });

    // Build a reflect-schemas-compatible structure so it goes through the same converter
    const properties: any[] = [];
    for (const symbol of checker.getPropertiesOfType(propsType as import('typescript').Type)) {
        const name = symbol.getName();
        const memberType = checker.getTypeOfSymbolAtLocation(symbol, sourceFile);
        const isOptional = (symbol.flags & ts.SymbolFlags.Optional) !== 0;
        const description = ts.displayPartsToString(symbol.getDocumentationComment(checker));
        const keyShape = {atomics: [{type: 'string', tags: []}], constants: [{type: 'string', values: [{value: name, tags: []}]}], required: true, optional: false, nullable: false, any: false, functions: [], templates: [], escaped: null, rest: null, arrays: [], tuples: [], objects: [], aliases: [], natives: [], sets: [], maps: []};

        // Detect function types — emit typia-style `value.functions: [...]`
        const callSigs = memberType.getCallSignatures();
        if (callSigs.length > 0) {
            const sig = callSigs[0];
            const params = sig.getParameters().map(p => {
                const pType = checker.getTypeOfSymbolAtLocation(p, sourceFile);
                return {
                    name: p.getName(),
                    type: emptyValueShape({natives: [{name: checker.typeToString(pType), tags: []}]}),
                };
            });
            const retTypeStr = checker.typeToString(sig.getReturnType());
            properties.push({
                key: keyShape,
                value: emptyValueShape({
                    required: !isOptional,
                    optional: isOptional,
                    functions: [{
                        parameters: params,
                        output: emptyValueShape({natives: [{name: retTypeStr, tags: []}]}),
                    }],
                }),
                description: description || null,
                jsDocTags: [],
            });
            continue;
        }

        const typeStr = checker.typeToString(memberType);
        properties.push({
            key: keyShape,
            value: emptyValueShape({
                required: !isOptional,
                optional: isOptional,
                natives: [{name: typeStr, tags: []}],
            }),
            description: description || null,
            jsDocTags: [],
        });
    }

    return {
        schemas: [{
            any: false, required: true, optional: false, nullable: false,
            functions: [], atomics: [], constants: [], templates: [],
            escaped: null, rest: null,
            arrays: [], tuples: [],
            objects: [{name: comp.propsType, tags: []}],
            aliases: [], natives: [], sets: [], maps: [],
        }],
        components: {
            objects: [{
                name: comp.propsType,
                properties,
                jsDocTags: [],
                index: 0,
                recursive: false,
                nullables: [],
            }],
            aliases: [],
            arrays: [],
            tuples: [],
        },
    };
}

// ─── Metadata → Uniform conversion ───────────────────────────────────────────



// ─── Schema → Uniform in emitted code ───────────────────────────────────────

// ─── Component detection (unchanged) ────────────────────────────────────────

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

    function walkNode(node: import('typescript').Node, prefix: string = '') {
        if (ts.isFunctionDeclaration(node) && node.name && (isExported(ts, node) || prefix)) {
            const name = prefix ? `${prefix}.${node.name.text}` : node.name.text;
            if (!isPascalCase(node.name.text)) return;
            const propsType = extractPropsType(ts, node, sourceFile);
            if (propsType) components.push({name, propsType, fileName});
        }

        if (ts.isVariableStatement(node) && (isExported(ts, node) || prefix)) {
            for (const decl of node.declarationList.declarations) {
                if (!ts.isIdentifier(decl.name)) continue;
                const localName = decl.name.text;
                const name = prefix ? `${prefix}.${localName}` : localName;
                if (!isPascalCase(localName)) continue;
                if (!decl.initializer) continue;

                if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
                    const propsType = extractPropsTypeFromParams(ts, decl.initializer.parameters, sourceFile);
                    if (propsType) components.push({name, propsType, fileName});
                    continue;
                }

                const contextType = extractCreateContextType(ts, decl.initializer, sourceFile);
                if (contextType) components.push({name, propsType: contextType, fileName});
            }
        }

        // Walk into namespace/module declarations
        if (ts.isModuleDeclaration(node) && node.body) {
            const nsName = prefix ? `${prefix}.${node.name.text}` : node.name.text;
            if (ts.isModuleBlock(node.body)) {
                ts.forEachChild(node.body, (child) => walkNode(child, nsName));
            } else if (ts.isModuleDeclaration(node.body)) {
                // Nested dotted namespace: `namespace a.b { ... }`
                walkNode(node.body, nsName);
            }
        }
    }

    ts.forEachChild(sourceFile, (node) => walkNode(node));

    // Re-exported declarations
    const foundNames = new Set(components.map(c => c.name));
    const reExportedNames = new Set<string>();

    ts.forEachChild(sourceFile, (node) => {
        if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
            for (const spec of node.exportClause.elements) {
                reExportedNames.add(spec.name.text);
            }
        }
    });

    ts.forEachChild(sourceFile, (node) => {
        if (ts.isFunctionDeclaration(node) && node.name && !isExported(ts, node)) {
            const name = node.name.text;
            if (!isPascalCase(name) || foundNames.has(name) || !reExportedNames.has(name)) return;
            const propsType = extractPropsType(ts, node, sourceFile);
            if (propsType) {
                components.push({name, propsType, fileName});
                foundNames.add(name);
            }
        }

        if (ts.isVariableStatement(node) && !isExported(ts, node)) {
            for (const decl of node.declarationList.declarations) {
                if (!ts.isIdentifier(decl.name)) continue;
                const name = decl.name.text;
                if (!isPascalCase(name) || foundNames.has(name) || !reExportedNames.has(name)) continue;
                if (!decl.initializer) continue;

                if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
                    const propsType = extractPropsTypeFromParams(ts, decl.initializer.parameters, sourceFile);
                    if (propsType) {
                        components.push({name, propsType, fileName});
                        foundNames.add(name);
                    }
                    continue;
                }

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

function extractCreateContextType(
    ts: typeof import('typescript'),
    initializer: import('typescript').Expression,
    sourceFile: import('typescript').SourceFile,
): string | null {
    if (!ts.isCallExpression(initializer)) return null;

    const callee = initializer.expression;
    const isCreateContext =
        (ts.isIdentifier(callee) && callee.text === 'createContext') ||
        (ts.isPropertyAccessExpression(callee) && callee.name.text === 'createContext');

    if (!isCreateContext) return null;

    const typeArgs = initializer.typeArguments;
    if (!typeArgs || typeArgs.length === 0) return null;

    const typeArg = typeArgs[0];

    if (ts.isUnionTypeNode(typeArg)) {
        const nonNullTypes = typeArg.types.filter(
            (t) => !(ts.isLiteralTypeNode(t) && t.literal.kind === ts.SyntaxKind.NullKeyword) &&
                   !(t.kind === ts.SyntaxKind.UndefinedKeyword),
        );
        if (nonNullTypes.length === 1) return nonNullTypes[0].getText(sourceFile);
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

    if (firstParam.type && ts.isTypeReferenceNode(firstParam.type)) {
        return firstParam.type.getText(sourceFile);
    }

    if (ts.isObjectBindingPattern(firstParam.name) && firstParam.type) {
        return firstParam.type.getText(sourceFile);
    }

    return null;
}


/**
 * Scans emitted JS for useState patterns in components that have __xydUniform.
 * Appends a state definition to the uniform reference.
 *
 * Detects: `const [name, setName] = useState(initialValue)`
 * Generates: definition with meta type=state, hookID, setter name
 */
function injectStateDefinitions(code: string, propertyName: string): string {
    // Find all components that have __xydUniform assignments
    const uniformRegex = new RegExp(`(\\w+)\\.${propertyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*=\\s*JSON\\.parse\\('([^']*)'\\)`, 'g');
    let result = code;

    let uniformMatch: RegExpExecArray | null;
    while ((uniformMatch = uniformRegex.exec(code)) !== null) {
        const componentName = uniformMatch[1];

        // Find the function body for this component
        const fnRegex = new RegExp(`function\\s+${componentName}\\s*\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\n\\}`, 'g');
        const fnMatch = fnRegex.exec(code);
        if (!fnMatch) continue;

        const fnBody = fnMatch[1];

        // Detect useState calls: const [x, setX] = useState(...)
        const useStateRegex = /const\s+\[(\w+)(?:,\s*(\w+))?\]\s*=\s*useState\(/g;
        const states: Array<{name: string; setter?: string; hookIndex: number}> = [];
        let hookIndex = 0;
        let stateMatch: RegExpExecArray | null;

        while ((stateMatch = useStateRegex.exec(fnBody)) !== null) {
            states.push({
                name: stateMatch[1],
                setter: stateMatch[2] || undefined,
                hookIndex,
            });
            hookIndex++;
        }

        if (states.length === 0) continue;

        // Build state definition properties
        const stateProperties = states.map(s => {
            const meta: any[] = [{name: 'hookID', value: String(s.hookIndex)}];
            if (s.setter) meta.push({name: 'setter', value: s.setter});
            return {name: s.name, type: 'unknown', description: '', meta};
        });

        const stateDef = {
            title: 'State',
            properties: stateProperties,
            meta: [{name: 'type', value: 'state'}],
        };

        // Parse existing uniform, add state definition, re-serialize
        try {
            const existingJson = uniformMatch[2]
                .replace(/\\\\/g, '\\')
                .replace(/\\'/g, "'");
            const uniform = JSON.parse(existingJson);
            uniform.definitions.push(stateDef);
            const newJson = JSON.stringify(uniform).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

            const stateReplacement = `${componentName}.${propertyName} = JSON.parse('${newJson}');`;
            result = result.replace(uniformMatch[0], () => stateReplacement);
        } catch {
            // Failed to parse/modify uniform — skip
        }
    }

    return result;
}


function resolveMetadataType(schema: any, components: any, typeResolver?: (name: string) => any[] | null): any {
    if (!schema) return {type: 'unknown'};

    // Atomics: string, number, boolean, bigint
    if (schema.atomics?.length === 1 && !schema.constants?.length && !schema.objects?.length) {
        return {type: schema.atomics[0].type};
    }

    // Constants: literal types (e.g. "admin" | "editor" | "viewer")
    if (schema.constants?.length > 0 && !schema.atomics?.length) {
        const allConstants = schema.constants.flatMap((c: any) => c.values || []);
        if (allConstants.length === 1) {
            return {type: schema.constants[0].type, const: allConstants[0].value};
        }
        if (allConstants.length > 1) {
            return {
                type: '$$xor',
                properties: allConstants.map((v: any) => ({
                    name: String(v.value),
                    type: schema.constants[0]?.type ?? 'string',
                    description: '',
                })),
            };
        }
    }

    // Objects: resolve from components
    if (schema.objects?.length > 0) {
        const objName = schema.objects[0].name;
        const objType = components.objects?.find((o: any) => o.name === objName);
        if (objType?.properties?.length) {
            // Preserve the original type name (VFS, BootVolume, etc.) for named user types.
            // Anonymous/inline objects in typia have names like __type, __object, or are numeric.
            const isNamed = objName && !/^(__type|__object|\d+)/.test(objName);
            return {
                type: isNamed ? objName : 'object',
                properties: objType.properties.map((p: any) => metadataPropertyToUniform(p, components, typeResolver)),
            };
        }
        // Try resolving via TS type checker
        if (typeResolver) {
            const resolvedProps = typeResolver(objName);
            if (resolvedProps) {
                // String literal union types are marked with __xor by the resolver
                if (resolvedProps.length > 0 && resolvedProps[0].__xor) {
                    return {type: '$xor', properties: resolvedProps.map((p: any) => ({name: p.name, type: p.type, description: p.description}))};
                }
                // Preserve the original type name (VFS, BootVolume, etc.) — not 'object'
                return {type: objName, properties: resolvedProps};
            }
        }
        return {type: objName};
    }

    // Aliases: resolve from components
    if (schema.aliases?.length > 0) {
        const aliasName = schema.aliases[0].name;
        const aliasType = components.aliases?.find((a: any) => a.name === aliasName);
        if (aliasType?.value) {
            return resolveMetadataType(aliasType.value, components, typeResolver);
        }
        return {type: aliasName};
    }

    // Arrays
    if (schema.arrays?.length > 0) {
        const arrName = schema.arrays[0].name;
        const arrType = components.arrays?.find((a: any) => a.name === arrName);
        const itemResolved = arrType?.value ? resolveMetadataType(arrType.value, components, typeResolver) : {type: 'unknown'};
        return {
            type: '$array',
            properties: [],
            ofProperty: {
                name: '',
                type: itemResolved.type,
                properties: itemResolved.properties || [],
                description: '',
                meta: [{name: 'required', value: 'true'}],
            },
        };
    }

    // Natives: built-in types (Date, Map, Set, etc.) or unresolved user types
    if (schema.natives?.length > 0) {
        let nativeName = schema.natives[0].name;
        // Strip "| null" / "| undefined" suffix for primitives — mark nullable
        let isNullable = false;
        const primitiveNullableMatch = nativeName.match(/^(string|number|boolean)\s*\|\s*(null|undefined)$/);
        if (primitiveNullableMatch) {
            nativeName = primitiveNullableMatch[1];
            isNullable = true;
        }
        // Check if this "native" is actually a user-defined type in components.objects
        const objType = components.objects?.find((o: any) => o.name === nativeName);
        if (objType?.properties?.length) {
            const result: any = {
                type: nativeName,
                properties: objType.properties.map((p: any) => metadataPropertyToUniform(p, components, typeResolver)),
            };
            if (isNullable) result.__nullable = true;
            return result;
        }
        // Try resolving via TS type checker (for user-defined types typia put in natives)
        if (typeResolver) {
            const resolvedProps = typeResolver(nativeName);
            if (resolvedProps && resolvedProps.length > 0) {
                const first = resolvedProps[0];

                // Array wrapper: "Tab[]" → $array with resolved element type
                if (first.__wrapperKind === 'array') {
                    let elementType = first.__elementType;
                    let elementProperties = first.__elementProperties || [];
                    if (first.__elementIsXor) {
                        return {
                            type: '$array',
                            properties: [],
                            ofProperty: {
                                name: '',
                                type: '$xor',
                                properties: elementProperties,
                                description: '',
                                meta: [{name: 'required', value: 'true'}],
                            },
                        };
                    }
                    return {
                        type: '$array',
                        properties: [],
                        ofProperty: {
                            name: '',
                            type: elementType,
                            properties: elementProperties,
                            description: '',
                            meta: [{name: 'required', value: 'true'}],
                        },
                    };
                }

                // Nullable wrapper: "Tab | null" → inner type with nullable meta
                if (first.__wrapperKind === 'nullable') {
                    const innerType = first.__innerType;
                    const innerProps = first.__innerProperties || [];
                    if (first.__innerIsXor) {
                        return {type: '$xor', properties: innerProps, __nullable: true};
                    }
                    if (first.__innerWrapperKind === 'union') {
                        return {type: '$$union', properties: first.__innerProperties, __nullable: true};
                    }
                    if (first.__innerWrapperKind === 'firstVariant') {
                        return {type: first.__innerVariantName, properties: first.__innerProperties, __nullable: true};
                    }
                    return {type: innerType, properties: innerProps, __nullable: true};
                }

                // Union wrapper: "TypeA | TypeB" → $$union with variants
                if (first.__wrapperKind === 'union') {
                    return {type: '$$union', properties: first.__variants};
                }

                // First-variant wrapper: discriminated union → emit just the first variant
                if (first.__wrapperKind === 'firstVariant') {
                    return {type: first.__variantName, properties: first.__variantProps};
                }

                // String literal union: "auto" | "plan" | "manual" → $xor
                if (first.__xor) {
                    return {type: '$xor', properties: resolvedProps.map((p: any) => ({name: p.name, type: p.type, description: p.description}))};
                }

                // Preserve the original type name (VFS, BootVolume, etc.) — not 'object'
                const r: any = {type: nativeName, properties: resolvedProps};
                if (isNullable) r.__nullable = true;
                return r;
            }
        }
        const fallback: any = {type: nativeName};
        if (isNullable) fallback.__nullable = true;
        return fallback;
    }

    // Functions: structured $$function type
    if (schema.functions?.length > 0) {
        const fn = schema.functions[0];
        const params = (fn.parameters || []).map((p: any) => {
            const pType = resolveMetadataType(p.type, components, typeResolver);
            return {
                name: p.name || '',
                type: pType.type,
                description: '',
                properties: pType.properties || [],
                meta: [],
            };
        });
        const retType = resolveMetadataType(fn.output, components, typeResolver);
        const retStr = retType.type === 'undefined' || !retType.type ? 'void' : retType.type;
        return {
            type: '$$function',
            properties: params,
            ofProperty: {name: '', type: retStr, description: '', meta: []},
        };
    }

    // Maps
    if (schema.maps?.length > 0) {
        const map = schema.maps[0];
        const keyType = resolveMetadataType(map.key, components, typeResolver);
        const valueType = resolveMetadataType(map.value, components, typeResolver);
        return {type: `Map<${keyType.type}, ${valueType.type}>`};
    }

    // Sets
    if (schema.sets?.length > 0) {
        const set = schema.sets[0];
        const valueType = resolveMetadataType(set.value, components, typeResolver);
        return {type: `Set<${valueType.type}>`};
    }

    // Escaped: types with toJSON() (e.g. Date → string). Use the original type.
    if (schema.escaped?.original) {
        return resolveMetadataType(schema.escaped.original, components, typeResolver);
    }

    // Tuples
    if (schema.tuples?.length > 0) {
        return {type: 'tuple'};
    }

    // Union: multiple types set
    const parts: string[] = [];
    if (schema.atomics?.length) parts.push(...schema.atomics.map((a: any) => a.type));
    if (schema.natives?.length) parts.push(...schema.natives.map((n: any) => n.name));
    if (schema.nullable) parts.push('null');
    if (parts.length > 1) return {type: parts.join(' | ')};
    if (parts.length === 1) return {type: parts[0]};

    if (schema.any) return {type: 'any'};

    return {type: 'unknown'};
}


function metadataPropertyToUniform(prop: any, components: any, typeResolver?: (name: string) => any[] | null): any {
    // Extract property name from key
    const keyConst = prop.key?.constants?.[0]?.values?.[0]?.value;
    const name = keyConst || '';

    const valueSchema = prop.value;
    const resolved = resolveMetadataType(valueSchema, components, typeResolver);

    const result: any = {
        name,
        type: resolved.type,
        description: prop.description || '',
        meta: [],
    };

    if (valueSchema.required && !valueSchema.optional) {
        result.meta.push({name: 'required', value: 'true'});
    }
    if (resolved.__nullable) {
        result.meta.push({name: 'nullable', value: 'true'});
    }

    if (resolved.properties) {
        result.properties = resolved.properties;
    }
    if (resolved.ofProperty) {
        result.ofProperty = resolved.ofProperty;
    }

    return result;
}

/**
 * Converts a typia reflect metadata schema to the xyd uniform reference format.
 */
function metadataToUniformReference(componentName: string, collection: any, typeResolver?: (name: string) => any[] | null): any {
    const ref: any = {
        title: componentName,
        canonical: '',
        description: '',
        definitions: [],
        examples: {groups: []},
    };

    const rootSchema = collection.schemas?.[0];
    if (!rootSchema) return ref;

    const components = collection.components || {};

    // Resolve the root props object
    let propsObj: any = null;
    if (rootSchema.objects?.length > 0) {
        const objName = rootSchema.objects[0].name;
        propsObj = components.objects?.find((o: any) => o.name === objName);
    }

    if (!propsObj?.properties?.length) return ref;

    const properties = propsObj.properties.map((prop: any) =>
        metadataPropertyToUniform(prop, components, typeResolver),
    );

    ref.definitions.push({
        title: 'Props',
        properties,
        meta: [{name: 'type', value: 'parameters'}],
    });

    return ref;
}

/**
 * Scans emitted code for resolved __xydSchema patterns and caches the uniform JSON by component name.
 * Called once per file during buildStart to populate the cross-file cache.
 */
function collectUniformCache(code: string, propertyName: string, typeResolver: ((name: string) => any[] | null) | undefined, cache: Map<string, string>): void {
    const schemaRegex = /([\w.]+)\.__xydSchema\s*=\s*(\{[\s\S]*?\n\});/g;
    let match: RegExpExecArray | null;
    while ((match = schemaRegex.exec(code)) !== null) {
        const componentName = match[1];
        const schemaStr = match[2];
        if (cache.has(componentName)) continue;
        try {
            const schema = new Function(`return ${schemaStr}`)();
            const uniform = metadataToUniformReference(componentName, schema, typeResolver);
            const jsonStr = JSON.stringify(uniform).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            cache.set(componentName, jsonStr);
        } catch { /* skip */ }
    }
}

function convertSchemaToUniform(code: string, propertyName: string = '__xydUniform', typeResolver?: (name: string) => any[] | null, uniformCache?: Map<string, string>): {code: string; map: null} | null {
    const schemaRegex = /([\w.]+)\.__xydSchema\s*=\s*(\{[\s\S]*?\n\});/g;
    let modified = code;
    let hasChanges = false;

    let match: RegExpExecArray | null;
    while ((match = schemaRegex.exec(code)) !== null) {
        const componentName = match[1];
        const schemaStr = match[2];

        try {
            const schema = new Function(`return ${schemaStr}`)();
            const uniform = metadataToUniformReference(componentName, schema, typeResolver);
            const jsonStr = JSON.stringify(uniform).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            const replacement = `${componentName}.${propertyName} = JSON.parse('${jsonStr}');`;

            // Use function replacement to avoid $$ interpolation in String.prototype.replace
            modified = modified.replace(match[0], () => replacement);
            hasChanges = true;
        } catch (e) {
            console.warn(`[xyd-source-react-runtime] Failed to parse schema for ${componentName}:`, e);
        }
    }

    // For raw (unresolved) typia calls, check if a cached uniform exists from another file
    if (uniformCache) {
        const rawRegex = /^\s*([\w.]+)\.__xydSchema\s*=\s*typia\.reflect\.schemas.*;\s*$/gm;
        let rawMatch: RegExpExecArray | null;
        while ((rawMatch = rawRegex.exec(modified)) !== null) {
            const componentName = rawMatch[1];
            const cached = uniformCache.get(componentName);
            if (cached) {
                const replacement = `${componentName}.${propertyName} = JSON.parse('${cached}');`;
                modified = modified.replace(rawMatch[0], () => replacement);
                hasChanges = true;
            }
        }
    }

    // Strip any remaining un-transformed typia calls
    modified = modified.replace(/^\s*[\w.]+\.__xydSchema\s*=\s*typia\.reflect\.schemas.*;\s*$/gm, '');
    modified = modified.replace(/^\s*[\w.]+\.__xydSchema\s*=\s*typia\.json\.schemas.*;\s*$/gm, '');
    modified = modified.replace(/^import typia from ["']typia["'];?\s*\n?/gm, '');

    // Detect useState hooks in component functions and inject state definitions
    modified = injectStateDefinitions(modified, propertyName);

    if (!hasChanges) return null;
    return {code: modified, map: null};
}

