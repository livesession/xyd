import {describe, expect, it} from 'vitest'

import {testGqlSchemaToReferences} from "./utils";

const tests: {
    name: string;
    description: string;
    options?: {
        flat?: boolean;
    };
}[] = [
    // {
    //     name: "1.basic",
    //     description: "A basic example",
    // },
    // {
    //     name: "2.circular",
    //     description: "A circular dependency reference example",
    // },
    // {
    //     name: "3.opendocs",
    //     description: "An opendocs directive example",
    // },
    // {
    //     name: "4.union",
    //     description: "An opendocs directive example",
    // },
    // {
    //     name: "5.flat",
    //     description: "Flat generation only via code options",
    //     options: {
    //         flat: true
    //     }
    // },
    // {
    //     name: "6.default-values",
    //     description: "Default values example",
    // },
    // {
    //     name: "7.type-args",
    //     description: "Type args",
    // },
    //
    // {
    //     name: "-1.od_gqls.flat",
    //     description: "OpenDocs GraphQL Schema directive example with flat generation",
    // },
    //
    // {
    //     name: "-3.array-non-null-return",
    //     description: "case: Array non-null return",
    //     options: {
    //         flat: true
    //     }
    // },

    // TODO: uncomment when ready
    // {
    //     name: "-2.complex.monday",
    //     description: "Monday.com GraphQL API example",
    //     options: {
    //         flat: true
    //     }
    // },
    // {
    //     name: "-2.complex.github",
    //     description: "Github GraphQL API example",
    //     // TODO: Github API is very, very huge. Currently. xyd does not support such big schemas well so we need to flat all types.
    //     options: {
    //         flat: true
    //     }
    // }
    {
        name: "-2.complex.livesession",
        description: "LiveSession GraphQL API example"
    }
]

describe("gqlSchemaToReferences", () => {
    tests.forEach((test) => {
        it(`[${test.name}]: ${test.description}`, async () => {
            await testGqlSchemaToReferences(test.name, test.options);
        });
    });
});
