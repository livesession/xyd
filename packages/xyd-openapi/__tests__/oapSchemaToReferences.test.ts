import {describe, expect, it} from 'vitest'

import {testOasSchemaToReferences} from "./utils";
import {uniformOasOptions} from "../src/types";
import {uniformOpenAIMeta} from "../__fixtures__/-2.complex.openai/pluginOasOpenai";

const tests: {
    name: string;
    description: string,
    url?: string, // URL to the OpenAPI schema
    plugins?: any[]; // TODO: fix any,
    options?: uniformOasOptions
}[] = [
    // TODO: uncomment when ready
    // {
    //     name: "-2.complex.openai",
    //     description: "OpenAI OpenAPI API example",
    //     plugins: [
    //         uniformOpenAIMeta,
    //     ],
    //     // options: {
    //     //    regions: [
    //     //        // "/components/schemas/ListAssistantsResponse",
    //     //        "POST /responses"
    //     //    ]
    //     // }
    // },

    {
        name: "4.abc",
        // url: "https://raw.githubusercontent.com/digitalocean/openapi/main/specification/DigitalOcean-public.v2.yaml",
        description: "Digital Ocean API example",
        // plugins: [
        //     uniformOpenAIMeta,
        // ],
    }

    // {
    //     name: "1.basic",
    //     description: "Basic OpenAPI API example",
    // },
    // {
    //     name: "2.more",
    //     description: "More OpenAPI API example",
    // },
    // {
    //     name: "3.multiple-responses",
    //     description: "Multiple responses OpenAPI API example",
    // },
    //
    // {
    //     name: "4.abc",
    //     description: "Multiple responses OpenAPI API example",
    // },
]

describe("oapSchemaToReferences",{ timeout: 15000 }, () => {
    tests.forEach((test) => {
        it(`[${test.name}]: ${test.description}`, async () => {
            await testOasSchemaToReferences(test.name, test.options, test.plugins, test.url);
        });
    });
});


