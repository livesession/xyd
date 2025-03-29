import * as TypeDoc from 'typedoc';
import type {TypeDocOptions} from "typedoc";

import {
    typedocToUniform
} from "./TypeDocTransformer"

export async function sourcesToUniform(
    root: string,
    entryPoints: string[],
) {
    // TODO: support another strategies
    // TODO: support entry points from github?
    const options = {
        entryPoints,
        plugin: [],
        readme: "none",
        disableSources: "true",
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

    const ref = typedocToUniform(root, projectJson)
    if (!ref) {
        console.error('Failed to generate documentation.');
        return
    }

    return ref
}