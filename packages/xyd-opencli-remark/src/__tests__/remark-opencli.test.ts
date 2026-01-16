import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';

import { testFixture, createTestServer, processMarkdown, readFixture } from './testHelpers';

const tests = [
  {
    name: '1.code-block-format',
    description: 'Code block format with tab indentation (default)',
  },
  {
    name: '2.list-format',
    description: 'Markdown list format with backticks (indent: list)',
  },
  {
    name: '3.root-command',
    description: 'Root command with empty path string',
  },
  {
    name: '4.nested-command',
    description: 'Nested subcommand (spice install dev)',
  },
  {
    name: '5.command-alias',
    description: 'Command lookup using alias (i -> install)',
  },
  {
    name: '6.options-with-arguments',
    description: 'Options that accept arguments (--config <path>)',
  },
  {
    name: '7.no-args-or-opts',
    description: 'Command with no arguments or options',
  },
  {
    name: '8.multiple-placeholders',
    description: 'Multiple placeholders in text, inline code, and code blocks',
  },
  {
    name: '9.list-format-arguments',
    description: 'Arguments in list format',
  },
  {
    name: '10.variadic-arguments',
    description: 'Usage generation for commands',
  },
  {
    name: '11.no-matching-key',
    description: 'Placeholders remain unchanged when no matching CLI key in frontmatter',
  },
];

describe('remarkOpencliDocs', () => {
  tests.forEach((test) => {
    it(`[${test.name}]: ${test.description}`, async () => {
      await testFixture(test.name);
    });
  });

  describe('URL source loading', () => {
    let testServer: Awaited<ReturnType<typeof createTestServer>>;
    const specPath = path.join(__dirname, '../__fixtures__/opencli-spec.json');

    beforeAll(async () => {
      testServer = await createTestServer(specPath);
    });

    afterAll(async () => {
      await testServer.close();
    });

    it('should load OpenCLI spec from HTTP URL', async () => {
      // Use the first fixture as input and expected output
      const input = readFixture('1.code-block-format/input.md');
      const expectedOutput = readFixture('1.code-block-format/output.md');

      const result = await processMarkdown(input, { spice: { source: testServer.url } });
      const output = String(result);
      
      expect(output.trim()).toEqual(expectedOutput.trim());
    });

    it('should handle HTTP errors gracefully', async () => {
      const input = `---
xyd.opencli.spice: "install"
---

Usage: {opencli.current.usage}`;

      // Use a URL that will 404
      const invalidUrl = testServer.url.replace('/opencli-spec.json', '/nonexistent.json');

      const result = await processMarkdown(input, { spice: { source: invalidUrl } });
      const output = String(result);
      
      // Should leave placeholder unchanged when spec fails to load
      expect(output).toContain('{opencli.current.usage}');
    });
  });
});
