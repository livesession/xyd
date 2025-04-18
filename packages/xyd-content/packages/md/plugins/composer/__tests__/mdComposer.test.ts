import { describe, it } from 'vitest';

import { testFixture } from './testHelpers';


const tests = [
  {
    name: "1.single-example",
    description: "A single example",
    input: "1.single-example/input.md",
    output: "1.single-example/output.md"
  },
  {
    name: "2.single-example-with-name",
    description: "A single example with a name",
    input: "2.single-example-with-name/input.md",
    output: "2.single-example-with-name/output.md"
  },
  {
    name: "3.multiple-examples",
    description: "Multiple examples",
    input: "3.multiple-examples/input.md",
    output: "3.multiple-examples/output.md"
  },
  {
    name: "4.example-groups",
    description: "Example groups",
    input: "4.example-groups/input.md",
    output: "4.example-groups/output.md"
  }
]

describe("mdComposer", () => {
  tests.forEach((test) => {
    it(`[${test.name}]: ${test.description}`, async () => {
      await testFixture(test.name);
    });
  });
});


