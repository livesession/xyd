import fs from "fs";
import path from "path";
import { describe, it, expect } from 'vitest';
import { remark } from 'remark'
import remarkDirective from "remark-directive";

import { mdComposer } from "../mdComposer";
import { outputVars } from '../../output-variables';
import { SymbolxVfile } from "../../types";

interface TestOutputVariables {
    examples: string
}

// Helper function to run a test with a specific fixture
export async function testFixture(fixtureName: string) {
    const input = readFixture(`${fixtureName}/input.md`);
    const expectedOutput = readFixtureOutput(`${fixtureName}/output.json`);

    const result = await processMarkdown(input);
    const output = result as SymbolxVfile<TestOutputVariables>
    const examples = output.data.outputVars?.examples

    expect(examples).toEqual(expectedOutput.examples);
}

// Helper function to process markdown with the mdComposer plugin
async function processMarkdown(input: string) {
    return await remark()
        .use(outputVars)
        .use(mdComposer())
        .use(remarkDirective)
        .process(input);
}


// Helper function to read fixture files
function readFixture(name: string) {
    const fixturePath = path.join(__dirname, "../__fixtures__", name);
    return fs.readFileSync(fixturePath, "utf8");
}

// Helper function to read fixture output
function readFixtureOutput(name: string) {
    const fixturePath = path.join(__dirname, "../__fixtures__", name);
    return JSON.parse(fs.readFileSync(fixturePath, "utf8"));
}

