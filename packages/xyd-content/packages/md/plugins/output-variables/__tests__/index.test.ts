import { describe, it } from 'vitest';

import { testFixture } from './testHelpers';

const tests = [
    {
        name: "1.simple",
        description: "A simple example of output variables",
        input: "1.simple/input.md",
        output: "1.simple/output.json"
    }
]

describe("outputVars", () => {
    tests.forEach((test) => {
        it(`[${test.name}]: ${test.description}`, async () => {
            await testFixture(test.name);
        });
    });
});

