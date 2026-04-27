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

    return {
        name: 'xyd-source-react-runtime',
        enforce: 'pre',

        async buildStart() {
            const tsconfigPath = options?.tsconfig || path.resolve(process.cwd(), 'tsconfig.json');
            transformedFiles = await buildTypiaSchemas(tsconfigPath);
        },

        transform(code, id) {
            if (!id.match(/\.[jt]sx?$/)) return null;
            const transformed = transformedFiles.get(path.resolve(id));
            if (!transformed) return null;
            return convertSchemaToUniform(transformed, propName, (transformedFiles as any).__typeResolver);
        },

        load(id) {
            if (!id.match(/\.[jt]sx?$/)) return null;
            const transformed = transformedFiles.get(path.resolve(id));
            if (!transformed) return null;
            return convertSchemaToUniform(transformed, propName, (transformedFiles as any).__typeResolver);
        },
    };
}

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

        const schemaObjPattern = (name: string) => new RegExp(`${name}\\.__xydSchema\\s*=\\s*\\{`);
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
                    const schemaMatch = singleOutput.match(new RegExp(`${comp.name}\\.__xydSchema\\s*=\\s*\\{[\\s\\S]*?\\n\\};`));
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

    return (typeName: string): any[] | null => {
        // Skip known built-in types and generic types
        if (BUILTIN_TYPES.has(typeName)) return null;
        if (typeName.includes('<') || typeName.includes('.')) return null;
        if (/^[a-z]/.test(typeName)) return null; // primitive types

        if (!program) {
            program = ts.createProgram({
                rootNames: parsedConfig.fileNames,
                options: {...parsedConfig.options, noEmit: false, declaration: false, sourceMap: false},
            });
        }

        const checker = program.getTypeChecker();

        // Search for the type in all source files
        for (const sourceFile of program.getSourceFiles()) {
            if (sourceFile.isDeclarationFile) continue;

            let foundType: import('typescript').Type | undefined;
            ts.forEachChild(sourceFile, (node) => {
                if (foundType) return;
                if (ts.isInterfaceDeclaration(node) && node.name.text === typeName) {
                    foundType = checker.getTypeAtLocation(node);
                }
                if (ts.isTypeAliasDeclaration(node) && node.name.text === typeName) {
                    foundType = checker.getTypeAtLocation(node);
                }
            });

            if (foundType) {
                const properties = checker.getPropertiesOfType(foundType);
                if (properties.length === 0) return null;

                return properties.map(sym => {
                    const memberType = checker.getTypeOfSymbolAtLocation(sym, sourceFile);
                    const typeStr = checker.typeToString(memberType);
                    const isOptional = (sym.flags & ts.SymbolFlags.Optional) !== 0;
                    const description = ts.displayPartsToString(sym.getDocumentationComment(checker));

                    return {
                        name: sym.getName(),
                        type: typeStr,
                        description: description || '',
                        meta: isOptional ? [] : [{name: 'required', value: 'true'}],
                    };
                });
            }
        }

        return null;
    };
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

    ts.forEachChild(sourceFile, (node) => {
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

    if (!propsType) return null;

    // Build a reflect-schemas-compatible structure so it goes through the same converter
    const properties: any[] = [];
    for (const symbol of checker.getPropertiesOfType(propsType)) {
        const name = symbol.getName();
        const memberType = checker.getTypeOfSymbolAtLocation(symbol, sourceFile);
        const typeStr = checker.typeToString(memberType);
        const isOptional = (symbol.flags & ts.SymbolFlags.Optional) !== 0;
        const description = ts.displayPartsToString(symbol.getDocumentationComment(checker));

        properties.push({
            key: {atomics: [{type: 'string', tags: []}], constants: [{type: 'string', values: [{value: name, tags: []}]}], required: true, optional: false, nullable: false, any: false, functions: [], templates: [], escaped: null, rest: null, arrays: [], tuples: [], objects: [], aliases: [], natives: [], sets: [], maps: []},
            value: {atomics: [], constants: [], required: !isOptional, optional: isOptional, nullable: false, any: false, functions: [], templates: [], escaped: null, rest: null, arrays: [], tuples: [], objects: [], aliases: [], natives: [{name: typeStr, tags: []}], sets: [], maps: []},
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

    if (resolved.properties) {
        result.properties = resolved.properties;
    }
    if (resolved.ofProperty) {
        result.ofProperty = resolved.ofProperty;
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
                type: '$xor',
                properties: allConstants.map((v: any) => ({
                    name: '',
                    type: 'object',
                    description: '',
                    meta: [{name: 'required', value: 'true'}],
                })),
            };
        }
    }

    // Objects: resolve from components
    if (schema.objects?.length > 0) {
        const objName = schema.objects[0].name;
        const objType = components.objects?.find((o: any) => o.name === objName);
        if (objType?.properties?.length) {
            return {
                type: 'object',
                properties: objType.properties.map((p: any) => metadataPropertyToUniform(p, components, typeResolver)),
            };
        }
        // Try resolving via TS type checker
        if (typeResolver) {
            const resolvedProps = typeResolver(objName);
            if (resolvedProps) return {type: 'object', properties: resolvedProps};
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
        const nativeName = schema.natives[0].name;
        // Check if this "native" is actually a user-defined type in components.objects
        const objType = components.objects?.find((o: any) => o.name === nativeName);
        if (objType?.properties?.length) {
            return {
                type: 'object',
                properties: objType.properties.map((p: any) => metadataPropertyToUniform(p, components, typeResolver)),
            };
        }
        // Try resolving via TS type checker (for user-defined types typia put in natives)
        if (typeResolver) {
            const resolvedProps = typeResolver(nativeName);
            if (resolvedProps) {
                return {type: 'object', properties: resolvedProps};
            }
        }
        return {type: nativeName};
    }

    // Functions: render signature
    if (schema.functions?.length > 0) {
        const fn = schema.functions[0];
        const params = (fn.parameters || []).map((p: any) => {
            const pType = resolveMetadataType(p.type, components, typeResolver);
            return `${p.name}: ${pType.type}`;
        }).join(', ');
        const retType = resolveMetadataType(fn.output, components, typeResolver);
        const retStr = retType.type === 'undefined' || !retType.type ? 'void' : retType.type;
        return {type: `(${params}) => ${retStr}`};
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

// ─── Schema → Uniform in emitted code ───────────────────────────────────────

function convertSchemaToUniform(code: string, propertyName: string = '__xydUniform', typeResolver?: (name: string) => any[] | null): {code: string; map: null} | null {
    const schemaRegex = /(\w+)\.__xydSchema\s*=\s*(\{[\s\S]*?\n\});/g;
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

            modified = modified.replace(
                match[0],
                `${componentName}.${propertyName} = JSON.parse('${jsonStr}');`,
            );
            hasChanges = true;
        } catch (e) {
            console.warn(`[xyd-source-react-runtime] Failed to parse schema for ${componentName}:`, e);
        }
    }

    // Strip any un-transformed typia calls that leaked through
    modified = modified.replace(/^\s*\w+\.__xydSchema\s*=\s*typia\.reflect\.schemas.*;\s*$/gm, '');
    modified = modified.replace(/^\s*\w+\.__xydSchema\s*=\s*typia\.json\.schemas.*;\s*$/gm, '');
    modified = modified.replace(/^import typia from ["']typia["'];?\s*\n?/gm, '');

    if (!hasChanges) return null;
    return {code: modified, map: null};
}

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

    ts.forEachChild(sourceFile, (node) => {
        if (ts.isFunctionDeclaration(node) && node.name && isExported(ts, node)) {
            const name = node.name.text;
            if (!isPascalCase(name)) return;
            const propsType = extractPropsType(ts, node, sourceFile);
            if (propsType) components.push({name, propsType, fileName});
        }

        if (ts.isVariableStatement(node) && isExported(ts, node)) {
            for (const decl of node.declarationList.declarations) {
                if (!ts.isIdentifier(decl.name)) continue;
                const name = decl.name.text;
                if (!isPascalCase(name)) continue;
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
    });

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