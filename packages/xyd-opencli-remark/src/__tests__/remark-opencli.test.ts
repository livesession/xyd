import { describe, it } from 'vitest';

import { testFixture } from './testHelpers';

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
});
