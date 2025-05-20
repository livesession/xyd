import path from 'node:path';
import fs from 'node:fs';

import * as TypeDoc from 'typedoc';
import type { TypeDocOptions } from "typedoc";

import type { Reference, ReferenceContext } from "@xyd-js/uniform";
import {
    typedocToUniform
} from "./TypeDocTransformer"


// TODO: SUPPORT GET FROM URL + VIRTUAL FS (OR NO FS JUST SET NEEDED OPTIONS VIA CODE)
export async function sourcesToUniform(
    root: string,
    entryPoints: string[]
): Promise<Reference<ReferenceContext>[] | undefined> {
    // TODO: support another strategies
    // TODO: support entry points from github?
    const options = {
        entryPoints,
        entryPointStrategy: TypeDoc.EntryPointStrategy.Packages,
    } satisfies Partial<TypeDocOptions>;

    const app = await TypeDoc.Application.bootstrapWithPlugins(options);
    const project = await app.convert()
    if (!project) {
        console.error('Failed to generate documentation.');
        return
    }

    const jsonOutput = await app.serializer.projectToObject(project, root);
    const projectJson = jsonOutput as unknown as TypeDoc.JSONOutput.ProjectReflection;

    // TODO: do better validation
    if (!projectJson.schemaVersion || !projectJson.children || !projectJson.children.length) {
        console.error('Failed to generate documentation.');
        return
    }

    fs.writeFileSync(path.join(root, "project.json"), JSON.stringify(projectJson, null, 2));

    const ref = typedocToUniform(root, projectJson)
    if (!ref) {
        console.error('Failed to generate documentation.');
        return
    }

    return ref
}

export async function sourcesToUniformV2(
    root: string,
    entryPoints: string[]
): Promise<{
    references: Reference<ReferenceContext>[];
    projectJson: TypeDoc.JSONOutput.ProjectReflection;
} | undefined> {
    // TODO: support another strategies
    // TODO: support entry points from github?
    const options = {
        entryPoints,
        entryPointStrategy: TypeDoc.EntryPointStrategy.Packages,
    } satisfies Partial<TypeDocOptions>;

    const app = await TypeDoc.Application.bootstrapWithPlugins(options);
    const project = await app.convert()
    if (!project) {
        console.error('Failed to generate documentation.');
        return
    }

    const jsonOutput = await app.serializer.projectToObject(project, root);
    const projectJson = jsonOutput as unknown as TypeDoc.JSONOutput.ProjectReflection;

    // TODO: do better validation
    if (!projectJson.schemaVersion || !projectJson.children || !projectJson.children.length) {
        console.error('Failed to generate documentation.');
        return
    }

    const references = typedocToUniform(root, projectJson)
    if (!references) {
        console.error('Failed to generate documentation.');
        return
    }

    return {
        references,
        projectJson
    }
}