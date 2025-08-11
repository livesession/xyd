import * as fs from "node:fs";
import * as path from "node:path";

import * as TypeDoc from 'typedoc';
import type {TypeDocOptions} from "typedoc";
//@ts-ignore
import {PluginOptions} from 'typedoc-plugin-markdown'

import {typedocToUniform} from "../src/TypeDocTransformer"

async function generateDocs() {
    const options = {
        entryPoints: [
            "example/package-a",
            // "example/package-b",
        ],
        plugin: [
            "typedoc-plugin-markdown"
        ],
        readme: "none",
        disableSources: true,
        entryPointStrategy: TypeDoc.EntryPointStrategy.Packages,

        indexFormat: "table",
        useCodeBlocks: true,
    } satisfies Partial<PluginOptions | TypeDocOptions>;

    const app = await TypeDoc.Application.bootstrapWithPlugins(options);
    const project = await app.convert()

    if (!project) {
        throw new Error('Failed to generate documentation.');
    }

    const jsonOutput = await app.serializer.projectToObject(project, path.resolve("./example"));
    fs.writeFileSync('docs.json', JSON.stringify(jsonOutput, null, 2));

    await app.generateOutputs(project);
    // await app.generateJson(project, 'docs.json');

    {
        const projectRaw = fs.readFileSync('docs.json', 'utf-8');
        const projectJson = JSON.parse(projectRaw);
        const ref = typedocToUniform(
            path.resolve("./example"),
            projectJson
        );

        fs.writeFileSync('references_todo.json', JSON.stringify(ref, null, 2));
    }

    // {
    //     const loader = new SignatureTextLoader(
    //         path.resolve('./example/package-a/src/index.ts')
    //     );
    //
    //     // TODO: some issues if line number higher than file lines
    //     const signature = signatureTextByLine(loader, 15);
    // }
}

generateDocs().catch(console.error);