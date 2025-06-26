import path from "node:path";
import fs from "node:fs";

import {expect} from "vitest";

import uniform from "@xyd-js/uniform";

import {
    deferencedOpenAPI,
    oapSchemaToReferences,

    type uniformOasOptions
} from "../index";

// Helper function to remove functions from an object
function removeFunctions(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(removeFunctions);
    }
    
    const result: any = {};
    for (const key in obj) {
        if (typeof obj[key] !== 'function') {
            result[key] = removeFunctions(obj[key]);
        }
    }
    return result;
}

// Helper function to run a test with a specific fixture
export async function testOasSchemaToReferences(
    fixtureName: string,
    options?: uniformOasOptions,
    plugins?: any[], // TODO: fix any,
    url?: string // URL to the OpenAPI schema
) {
    const schemaLocation = url ? url : fullFixturePath(`${fixtureName}/input.yaml`)

    const schemalocation = await deferencedOpenAPI(schemaLocation);
    let result = oapSchemaToReferences(schemalocation, options);
    if (plugins?.length) {
        const uni = uniform(result, {
            plugins
        })

        result = uni.references;
    }

    // saveResultAsOutput(fixtureName, result) // TODO: comment for prod

    const expectedOutput = readFixtureOutput(`${fixtureName}/output.json`);
    try {
        // Remove functions before comparison
        const cleanResult = removeFunctions(result);
        const cleanExpected = removeFunctions(expectedOutput);
        expect(cleanResult).toEqual(cleanExpected);
    } catch (error) {
        if (result?.length > 100) {
            throw new Error(`FAILED: The diff result is too long (${result.length} items) to show.`);
        }
        throw error;
    }
}

// Helper function to read fixture output
function readFixtureOutput(name: string) {
    const fixturePath = fullFixturePath(name);
    return JSON.parse(fs.readFileSync(fixturePath, "utf8"));
}

function fullFixturePath(name: string) {
    return path.join(__dirname, "../__fixtures__", name);
}

function saveResultAsOutput(fixtureName: string, result: any) {
    fs.writeFileSync(fullFixturePath(fixtureName + "/output.json"), JSON.stringify(result, null, 2));
}
