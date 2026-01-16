import fs from 'fs';
import path from 'path';
import http from 'http';
import { expect } from 'vitest';
import { remark } from 'remark';
import remarkFrontmatter from 'remark-frontmatter';
import remarkStringify from 'remark-stringify';

import { remarkOpencliDocs } from '../remark-opencli';
import type { OpencliDocsOptions } from '../remark-opencli';
import { FixturePath } from './types.gen';

// Helper function to run a test with a specific fixture
export async function testFixture(fixtureName: string) {
  const input = readFixture(`${fixtureName}/input.md`);
  const expectedOutput = readFixture(`${fixtureName}/output.md`);
  const specPath = path.join(__dirname, '../__fixtures__/opencli-spec.json');

  const result = await processMarkdown(input, { spice: { source: specPath } });
  const output = String(result);

  // Uncomment to debug: write actual output to file
  if (fixtureName === '11.no-matching-key') {
    const actualPath = path.join(__dirname, '../__fixtures__', `${fixtureName}/actual.md`);
    fs.writeFileSync(actualPath, output);
  }

  expect(output.trim()).toEqual(expectedOutput.trim());
}

// Helper function to process markdown with the remarkOpencliDocs plugin
export async function processMarkdown(input: string, options: OpencliDocsOptions) {
  return await remark()
    .use(remarkFrontmatter)
    .use(remarkOpencliDocs, options)
    .use(remarkStringify, { bullet: '-' })
    .process(input);
}

// Helper function to read fixture files
export function readFixture(name: FixturePath) {
  const fixturePath = path.join(__dirname, '../__fixtures__', name);
  return fs.readFileSync(fixturePath, 'utf8');
}

// Server management for URL-based tests
export interface TestServer {
  server: http.Server;
  url: string;
  close: () => Promise<void>;
}

/**
 * Creates a test HTTP server that serves the OpenCLI spec JSON
 * @param specPath Path to the OpenCLI spec JSON file to serve
 * @param endpoint Endpoint path to serve the spec at (default: '/opencli-spec.json')
 * @returns Promise that resolves to server info with url and close method
 */
export async function createTestServer(
  specPath: string,
  endpoint: string = '/opencli-spec.json'
): Promise<TestServer> {
  const specContent = fs.readFileSync(specPath, 'utf-8');

  return new Promise<TestServer>((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (req.url === endpoint) {
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(specContent);
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(0, () => {
      const address = server.address();
      let url: string;

      if (address && typeof address === 'object' && 'port' in address) {
        url = `http://localhost:${address.port}${endpoint}`;
      } else if (typeof address === 'string') {
        url = `http://${address}${endpoint}`;
      } else {
        server.close();
        reject(new Error('Failed to get server address'));
        return;
      }

      resolve({
        server,
        url,
        close: () => {
          return new Promise<void>((resolve) => {
            server.close(() => {
              resolve();
            });
          });
        },
      });
    });

    server.on('error', (error) => {
      reject(error);
    });
  });
}
