import * as path from 'node:path';
import {resolve} from "path";
import {accessSync} from "node:fs";
import ts from "typescript";

import * as TypeDoc from 'typedoc';
import type {NormalizedPath, TypeDocOptions} from "typedoc";

import type {Reference, ReferenceContext} from "@xyd-js/uniform";
import {
    typedocToUniform
} from "./TypeDocTransformer"

export {
    uniformToMiniUniform
} from "./uniformToMiniUniform"

const importedFiles = new Set<string>();

// TODO: SUPPORT GET FROM URL + VIRTUAL FS (OR NO FS JUST SET NEEDED OPTIONS VIA CODE)
// TODO: in the future typedoc options?
export interface SourcesToUniformV2Options {
    cwd?: string;
    tsconfig?: string;
}

export async function sourcesToUniformV2(
    root: string,
    entryPoints: string[],
    extraOptions?: SourcesToUniformV2Options,
): Promise<{
    references: Reference<ReferenceContext>[];
    projectJson: TypeDoc.JSONOutput.ProjectReflection;
} | undefined> {
    return await _sourcesToUniformV2(root, entryPoints, extraOptions);
}

async function _sourcesToUniformV2(
    root: string,
    entryPoints: string[],
    extraOptions?: SourcesToUniformV2Options,
): Promise<{
    references: Reference<ReferenceContext>[];
    projectJson: TypeDoc.JSONOutput.ProjectReflection;
} | undefined> {
    // TODO: support another strategies
    // TODO: support entry points from github?
    const commonOptions: Partial<TypeDocOptions> = {
        // entryPoints,
        // entryPointStrategy: TypeDoc.EntryPointStrategy.Packages,
        exclude: ["**/*.test.ts", "**/*.test.tsx"],
        // @ts-ignore // TODO: for some reason on build types mismatch
        excludePrivate: true,
        // @ts-ignore
        excludeProtected: true,
        // @ts-ignore
        excludeExternals: true,
        // @ts-ignore
        includeVersion: true,
        // @ts-ignore
        // hideGenerator: true,
        // @ts-ignore
        skipErrorChecking: true,

        // @ts-ignore
        sort: ['source-order'],
        // @ts-ignore
        sortEntryPoints: false,
    }

    const options = {
        ...commonOptions,
    }
    const everySingleFile = entryPoints?.every(ep => !!path.extname(ep))

    if (everySingleFile) {
        entryPoints.map(ep => {
            findImports(root, path.resolve(root, ep));
        })
        const fileImported = Array.from(importedFiles) || []
        options.entryPoints = [
            ...[
                ...entryPoints,
                ...fileImported
            ]?.map(ep => path.resolve(root, ep))
        ]
    } else {
        options.entryPointStrategy = TypeDoc.EntryPointStrategy.Packages
        options.entryPoints = entryPoints
        options.packageOptions = {
            ...commonOptions,
        }
    }

    // Resolve tsconfig explicitly so TypeDoc doesn't rely on process.cwd()
    if (extraOptions?.tsconfig) {
        options.tsconfig = extraOptions.tsconfig;
    } else {
        const tsConfigPath = path.resolve(root, 'tsconfig.json');
        try {
            accessSync(tsConfigPath);
            options.tsconfig = tsConfigPath;
        } catch {}
    }

    const app = await TypeDoc.Application.bootstrapWithPlugins(options);
    const project = await app.convert();
    if (!project) {
        console.error('Failed to generate documentation.');
        return
    }

    const jsonOutput = await app.serializer.projectToObject(project, root as NormalizedPath);
    const projectJson = jsonOutput as unknown as TypeDoc.JSONOutput.ProjectReflection;

    if (!projectJson.schemaVersion || !projectJson.children || !projectJson.children.length) {
        console.error('Failed to generate documentation.');
        return
    }

    // Build a map of all reflections (including non-exported interfaces/types)
    // from the full project before serialization. This allows resolving
    // type arguments that reference non-exported types (e.g. createContext<T>).
    // Build a map of ALL type declarations (including non-exported) using TS compiler
    const allReflections = buildAllReflectionsFromTS(
        options.entryPoints?.map(ep => typeof ep === 'string' ? ep : '') || [],
    )
    const references = typedocToUniform(root, projectJson, {allReflections})
    if (!references) {
        console.error('Failed to generate documentation.');
        return
    }
    return {
        references,
        projectJson
    }
}

/**
 * Uses the TypeScript compiler to extract all interface/type declarations
 * (including non-exported) from source files. Returns a map of
 * typeName → [{name, type, comment, flags}] for each member.
 */
function buildAllReflectionsFromTS(filePaths: string[]): Record<string, any[]> {
    const map: Record<string, any[]> = {}

    for (const filePath of filePaths) {
        const content = ts.sys.readFile(filePath)
        if (!content) continue

        const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true)

        ts.forEachChild(sourceFile, (node) => {
            if (ts.isInterfaceDeclaration(node)) {
                const members: any[] = []
                for (const member of node.members) {
                    if (ts.isPropertySignature(member) && member.name) {
                        const name = member.name.getText(sourceFile)
                        const type = member.type ? member.type.getText(sourceFile) : ''
                        const isOptional = !!member.questionToken
                        const jsDoc = ts.getJSDocCommentsAndTags(member)
                        let comment = ''
                        for (const doc of jsDoc) {
                            if (ts.isJSDoc(doc) && doc.comment) {
                                comment = typeof doc.comment === 'string' ? doc.comment : doc.comment.map((c: any) => c.text || '').join('')
                            }
                        }
                        members.push({name, type, comment, flags: {isOptional}})
                    }
                    if (ts.isMethodSignature(member) && member.name) {
                        const name = member.name.getText(sourceFile)
                        const returnType = member.type ? member.type.getText(sourceFile) : 'void'
                        const params = member.parameters?.map(p => p.getText(sourceFile)).join(', ') || ''
                        const isOptional = !!member.questionToken
                        members.push({name, type: `(${params}) => ${returnType}`, comment: '', flags: {isOptional}})
                    }
                }
                if (members.length) {
                    map[node.name.text] = members
                }
            }
        })
    }

    return map
}

// TODO: nested strategy
// TODO: better mechanism?
function findImports(root: string, file: string, seen = new Set()) {
    if (seen.has(file)) return;
    seen.add(file);

    const source = ts.createSourceFile(
        file,
        ts.sys.readFile(file) || "",
        ts.ScriptTarget.Latest,
        true
    );

    for (const stmt of source.statements) {
        if (ts.isImportDeclaration(stmt) && stmt.moduleSpecifier) {
            const importPath = stmt.moduleSpecifier.getText().replace(/['"]/g, "");
            if (importPath.startsWith(".")) {
                const resolved = resolve(file, "..", importPath + ".ts"); // TODO: support .tsx also + aliases
                const relativePath = path.relative(root, resolved);
                importedFiles.add(relativePath);
                findImports(root, resolved, seen);
            }
        }
    }
}

