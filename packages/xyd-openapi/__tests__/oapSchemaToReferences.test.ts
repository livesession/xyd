import {describe, expect, it} from 'vitest'

import {testOasSchemaToReferences} from "./utils";
import {uniformOasOptions} from "../src/types";
import {uniformOpenAIMeta} from "../__fixtures__/-2.complex.openai/pluginOasOpenai";

const tests: {
    name: string;
    description: string,
    plugins?: any[]; // TODO: fix any,
    options?: uniformOasOptions
}[] = [
    // TODO: uncomment when ready
    {
        name: "-2.complex.openai",
        description: "OpenAI OpenAPI API example",
        plugins: [
            uniformOpenAIMeta,
        ],
        options: {
           // regions: [
           //     "/components/schemas/ListAssistantsResponse"
           // ]
        }
    },

    // {
    //     name: "1.basic",
    //     description: "Basic OpenAPI API example",
    // },
    // {
    //     name: "2.more",
    //     description: "More OpenAPI API example",
    // },
]

describe("oapSchemaToReferences", () => {
    tests.forEach((test) => {
        it(`[${test.name}]: ${test.description}`, async () => {
            await testOasSchemaToReferences(test.name, test.options, test.plugins);
        });
    });
});


