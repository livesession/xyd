import {describe, expect, it} from 'vitest'

import {testOasSchemaToReferences} from "./utils";
import {oapSchemaToReferencesOptions} from "../src/types";
import {uniformOpenAIMeta} from "../__fixtures__/-2.complex.openai/pluginOasOpenai";

const tests: {
    name: string;
    description: string,
    plugins?: any[]; // TODO: fix any,
    options?: oapSchemaToReferencesOptions
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
]

describe("oapSchemaToReferences", () => {
    tests.forEach((test) => {
        it(`[${test.name}]: ${test.description}`, async () => {
            await testOasSchemaToReferences(test.name, test.options, test.plugins);
        });
    });
});


