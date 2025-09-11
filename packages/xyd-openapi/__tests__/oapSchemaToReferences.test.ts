import {describe, expect, it} from 'vitest'

import {testOasSchemaToReferences} from "./utils";
import {uniformOasOptions} from "../src/types";
import {uniformOpenAIMeta} from "../__fixtures__/-2.complex.openai/pluginOasOpenai";
import {uniformPluginXDocsSidebar} from "../src/xdocs/pluginSidebar";

const tests: {
    name: string;
    description: string,
    url?: string, // URL to the OpenAPI schema
    plugins?: any[]; // TODO: fix any,
    options?: uniformOasOptions
}[] = [
    // {
    //     name: "-3.random",
    //     // url: "https://raw.githubusercontent.com/bump-sh-examples/train-travel-api/main/openapi.yaml",
    //     // url: "https://raw.githubusercontent.com/digitalocean/openapi/main/specification/DigitalOcean-public.v2.yaml",
    //     // url: "https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/ghes-3.0/ghes-3.0.json",
    //     // url: "https://raw.githubusercontent.com/box/box-openapi/main/openapi.json",
    //     // url: "https://api.apis.guru/v2/specs/nytimes.com/article_search/1.0.0/openapi.yaml",
    //     // url: "https://developers.intercom.com/_spec/docs/references/@2.11/rest-api/api.intercom.io.json",
    //     // url: "https://raw.githubusercontent.com/livesession/livesession-openapi/refs/heads/master/openapi.yaml",
    //     // url: "https://openapi.vercel.sh",
    //     description: "",
    //     // plugins: [
    //     //     uniformPluginXDocsSidebar
    //     // ]
    // },
    //
    {
        name: "1.basic",
        description: "Basic OpenAPI API example",
    },
    {
        name: "2.more",
        description: "More OpenAPI API example",
    },
    {
        name: "3.multiple-responses",
        description: "Multiple responses OpenAPI API example",
    },
    {
        name: "5.xdocs.codeLanguages",
        description: "x-docs OpenAPI API codeLanguages example",
    },
    {
        name: "5.xdocs.sidebar",
        description: "x-docs OpenAPI API sidebar example",
        plugins: [
            uniformPluginXDocsSidebar
        ]
    },
    {
        name: "6.codeSamples",
        description: "x-codeSamples OpenAPI API example",
    },
    {
        name: "7.examples",
        description: "OpenAPI examples property",
    }
]

describe("oapSchemaToReferences", {timeout: 15000}, () => {
    tests.forEach((test) => {
        it(`[${test.name}]: ${test.description}`, async () => {
            await testOasSchemaToReferences(test.name, test.options, test.plugins, test.url);
        });
    });
});

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
