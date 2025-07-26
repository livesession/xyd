import * as path from "node:path";
import * as fs from "node:fs";

import {expect} from "vitest";

import type {Test} from "./types";
import {sourcesToUniformV2, uniformToMiniUniform} from "../packages/ts";
import {Reference, TypeDocReferenceContext} from "@xyd-js/uniform";
import {uniformToReactUniform} from "../packages/react";

// Helper function to run a test with a specific fixture
export async function testSourcesToUniform(test: Test) {
    const {
        id: fixtureName,
        file: fixtureFile,
    } = test;
    const fixtureRoot = fullFixturePath(fixtureFile);

    const resp = await sourcesToUniformV2(fixtureRoot,
        test.entryPoints || [],
    );
    if (!resp || !resp.references || !resp.projectJson) {
        throw new Error("Failed to generate documentation.")
    }

    if (resp.projectJson && test.saveTypedoc) {
        const typedocOutputPath = fullFixturePath(path.join(fixtureFile, `${fixtureName}.output.typedoc.json`));
        fs.writeFileSync(typedocOutputPath, JSON.stringify(resp.projectJson, null, 2));
    }

    let result: Reference[]
    {
        const references = resp.references as Reference<TypeDocReferenceContext>[]
        const referencesCopy = JSON.parse(JSON.stringify(references));
        if (test.react) {
            const reactUniform = uniformToReactUniform(references, resp.projectJson)
            result = reactUniform;
        } else if (test.miniUniformRoot) {
            const miniUniform = uniformToMiniUniform(test.miniUniformRoot, references)
            result = miniUniform;
        } else {
            result = resp.references;
        }

        if (test.saveUniform) {
            saveResultAsOutput(fixtureFile, fixtureName, referencesCopy, test.multiOutput || false, true);
        }
    }

    if (test.forceSave) {
        saveResultAsOutput(fixtureFile, fixtureName, result, test.multiOutput || false);
    }

    const expectedOutput = readFixtureOutput(fixtureFile, fixtureName, test.multiOutput || false);

    try {
        expect(result).toEqual(expectedOutput);
    } catch (error) {
        if (result?.length > 100) {
            throw new Error(`FAILED: The diff result is too long (${result.length} items) to show.`);
        }
        throw error;
    }
}

// Helper function to read fixture output
function readFixtureOutput(
    fixtureBasePath: string,
    fixtureName: string,
    multiOutput: boolean,
) {
    const name = outputName(fixtureName, multiOutput, false);
    const fixturePath = fullFixturePath(path.join(fixtureBasePath, name));

    return JSON.parse(fs.readFileSync(fixturePath, "utf8"));
}

function fullFixturePath(name: string) {
    return path.join(__dirname, "../__fixtures__", name);
}

function saveResultAsOutput(fixtureBasePath: string, fixtureName: string, result: any, multiOutput: boolean, uniform?: boolean) {
    const name = outputName(fixtureName, multiOutput, uniform);
    const fixturePath = fullFixturePath(path.join(fixtureBasePath, name));

    fs.writeFileSync(fixturePath, JSON.stringify(result, null, 2));
}

function outputName(
    fixtureName: string,
    multiOutput: boolean,
    uniform?: boolean,
) {
    let name = "";
    if (multiOutput) {
        name = `${fixtureName}.output.json`;
        if (uniform) {
            name = `${fixtureName}.output.uniform.json`;
        }
    } else {
        name = name || "output.json";
        if (uniform) {
            name = "output.uniform.json";
        }
    }

    return name;
}
