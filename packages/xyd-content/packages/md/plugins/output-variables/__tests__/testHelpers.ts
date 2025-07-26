import path from 'node:path';
import fs from 'node:fs';

import { remark } from 'remark'
import { expect } from 'vitest';

import { remarkOutputVars } from '../remarkOutputVars';

const fixturesDir = path.resolve(__dirname, '../__fixtures__');

// Helper function to run a test with a specific fixture
export async function testFixture(fixtureName: string) {
    const input = readFixture(`${fixtureName}/input.md`);
    const expectedOutput = readFixtureOutput(`${fixtureName}/output.json`);

    const result = await processMarkdown(input)
    expect(result).toEqual(expectedOutput);
}

// Helper function to read fixture files
function readFixture(name: string) {
    const fixturePath = path.join(fixturesDir, name);
    return fs.readFileSync(fixturePath, "utf8");
}

// Helper function to read fixture output
function readFixtureOutput(name: string) {
    const fixturePath = path.join(fixturesDir, name);
    return JSON.parse(fs.readFileSync(fixturePath, "utf8"));
}

function processMarkdown(input: string) {
    return remark()
        .use(remarkOutputVars)
        .parse(input)
}