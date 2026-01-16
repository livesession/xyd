import fs from 'fs';
import path from 'path';
import { expect } from 'vitest';
import { remark } from 'remark';
import remarkFrontmatter from 'remark-frontmatter';
import remarkStringify from 'remark-stringify';

import { remarkOpencliDocs } from '../remark-opencli';

// Helper function to run a test with a specific fixture
export async function testFixture(fixtureName: string) {
  const input = readFixture(`${fixtureName}/input.md`);
  const expectedOutput = readFixture(`${fixtureName}/output.md`);
  const specPath = path.join(__dirname, '../__fixtures__/opencli-spec.json');

  const result = await processMarkdown(input, specPath);
  const output = String(result);

  // Uncomment to debug: write actual output to file
  if (fixtureName === '11.no-matching-key') {
    const actualPath = path.join(__dirname, '../__fixtures__', `${fixtureName}/actual.md`);
    fs.writeFileSync(actualPath, output);
  }

  expect(output.trim()).toEqual(expectedOutput.trim());
}

// Helper function to process markdown with the remarkOpencliDocs plugin
async function processMarkdown(input: string, specPath: string) {
  return await remark()
    .use(remarkFrontmatter)
    .use(remarkOpencliDocs, { spice: { source: specPath } })
    .use(remarkStringify, { bullet: '-' })
    .process(input);
}

// Helper function to read fixture files
function readFixture(name: string) {
  const fixturePath = path.join(__dirname, '../__fixtures__', name);
  return fs.readFileSync(fixturePath, 'utf8');
}
