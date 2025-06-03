import { describe, it } from 'vitest';

import { testFixture } from './testHelpers';

const tests = [
    {
        name: "1.simple",
        description: "A simple example of output variables",
        input: "1.simple/input.md",
        output: "1.simple/output.json"
    },
    {
        name: "2.multiple-vars",
        description: "A example of multiple output variables",
        input: "2.multiple-vars/input.md",
        output: "2.multiple-vars/output.json"
    }

]

describe("outputVars", () => {
    tests.forEach((test) => {
        it(`[${test.name}]: ${test.description}`, async () => {
            await testFixture(test.name);
        });
    });
});

