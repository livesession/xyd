import path from "node:path";
import fs from "node:fs";

import {expect} from "vitest";

import {gqlSchemaToReferences} from "../src";

// Helper function to run a test with a specific fixture
export async function testGqlSchemaToReferences(fixtureName: string) {
    const schemaLocation = fullFixturePath(`${fixtureName}/input.graphql`)
    const expectedOutput = readFixtureOutput(`${fixtureName}/output.json`);

    const result = await gqlSchemaToReferences(schemaLocation);

    expect(result).toEqual(expectedOutput);
}

// Helper function to read fixture output
function readFixtureOutput(name: string) {
    const fixturePath = fullFixturePath(name);
    return JSON.parse(fs.readFileSync(fixturePath, "utf8"));
}

function fullFixturePath(name: string) {
    return path.join(__dirname, "../__fixtures__", name);
}
