import {describe, expect, it} from 'vitest'

import {testGqlSchemaToReferences} from "./utils";

const tests = [
    // {
    //     name: "1.basic",
    //     description: "A basic example",
    // },
    {
        name: "2.circular",
        description: "A circular dependency reference example",
    },
]

describe("gqlSchemaToReferences", () => {
    tests.forEach((test) => {
        it(`[${test.name}]: ${test.description}`, async () => {
            await testGqlSchemaToReferences(test.name);
        });
    });
});
