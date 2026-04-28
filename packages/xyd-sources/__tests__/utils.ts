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

// Strip fields that are unstable across environments (TypeDoc symbol IDs,
// React type expansions that differ by @types/react version, etc.)
function normalize(obj: any): any {
    if (obj == null || typeof obj !== "object") return obj;

    if (Array.isArray(obj)) return obj.map(normalize);

    const result: any = {};
    for (const key of Object.keys(obj)) {
        if (key === "symbolId") continue;
        let val = obj[key];
        // Normalize React type generics that expand differently across @types/react versions
        // e.g. "React.ElementType<any, keyof IntrinsicElements>" → "React.ElementType"
        if (key === "type" && typeof val === "string") {
            val = val.replace(/React\.ElementType<[^>]+>/g, "React.ElementType");
        }
        result[key] = normalize(val);
    }
    return result;
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
        expect(normalize(result)).toEqual(normalize(expectedOutput));
    } catch (error) {
        if (result?.length > 100) {
            throw new Error(`FAILED: The diff result is too long (${result.length} items) to show.`);
        }
        throw error;
    }
}