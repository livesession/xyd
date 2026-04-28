import * as path from "node:path";
import * as fs from "node:fs";

import {expect} from "vitest";

import {sourcesToUniformV2} from "../packages/ts";
import {Reference, TypeDocReferenceContext} from "@xyd-js/uniform";
import {uniformToReactUniform} from "../packages/react";
import {uniformToMiniUniform} from "../packages/ts";

export interface Test {
    name: string;
    description: string;
    entryPoints: string[];
    mode: { type: "react" } | { type: "miniUniform"; root: string };
}

function fixturePath(name: string) {
    return path.join(__dirname, "../__fixtures__", name);
}

export async function testSourcesToUniform(test: Test) {
    const inputDir = fixturePath(path.join(test.name, "input"));
    const outputPath = fixturePath(path.join(test.name, "output.json"));

    const resp = await sourcesToUniformV2(inputDir, test.entryPoints);
    if (!resp || !resp.references || !resp.projectJson) {
        throw new Error("Failed to generate documentation.");
    }

    let result: Reference[];

    const references = resp.references as Reference<TypeDocReferenceContext>[];
    if (test.mode.type === "react") {
        result = uniformToReactUniform(references, resp.projectJson);
    } else {
        result = uniformToMiniUniform(test.mode.root, references);
    }

    // Save output when FORCE_SAVE is set (for regenerating fixtures)
    if (process.env.FORCE_SAVE === "true") {
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    }

    const expectedOutput = JSON.parse(fs.readFileSync(outputPath, "utf8"));

    try {
        expect(result).toEqual(expectedOutput);
    } catch (error) {
        if (result?.length > 100) {
            throw new Error(`FAILED: The diff result is too long (${result.length} items) to show.`);
        }
        throw error;
    }
}