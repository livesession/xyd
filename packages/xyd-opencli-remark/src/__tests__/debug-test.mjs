import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { remark } from 'remark';
import remarkFrontmatter from 'remark-frontmatter';
import remarkStringify from 'remark-stringify';
import { remarkOpencliDocs } from '../remark-opencli.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function debugTest(fixtureName) {
  const inputPath = path.join(__dirname, '../__fixtures__', `${fixtureName}/input.md`);
  const input = fs.readFileSync(inputPath, 'utf8');
  const specPath = path.join(__dirname, '../__fixtures__/opencli-spec.json');

  const result = await remark()
    .use(remarkFrontmatter)
    .use(remarkOpencliDocs, { source: specPath })
    .use(remarkStringify, { bullet: '-' })
    .process(input);
  
  const output = String(result);
  console.log('=== ACTUAL OUTPUT ===');
  console.log(output);
  console.log('=== END ===');
}

const fixtureName = process.argv[2] || '3.root-command';
debugTest(fixtureName).catch(console.error);
