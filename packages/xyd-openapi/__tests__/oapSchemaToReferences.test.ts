import {describe, expect, it} from 'vitest'

import {testOasSchemaToReferences} from "./utils";
import {uniformOasOptions} from "../src/types";
import {uniformOpenAIMeta} from "../__fixtures__/-2.complex.openai/pluginOasOpenai";
import {uniformPluginXDocsSidebar} from "../src/xdocs/pluginSidebar";

// The FULL fixture matrix runs — these outputs are the frozen parity oracle for
// the Rust migration (crates/xyd_openapi). Regen is explicit only:
//   OAS_BUILD_FIXTURES=1 pnpm vitest run __tests__/oapSchemaToReferences.test.ts
// Fixtures with `plugins` exercise JS-closure post-processing — the Rust tier-1
// parity test skips those (covered by the through-shim vitest tier instead).
const tests: {
    name: string;
    description: string,
    url?: string, // URL to the OpenAPI schema
    plugins?: any[]; // TODO: fix any,
    options?: uniformOasOptions
}[] = [
    {
        name: "-2.complex.openai",
        description: "OpenAI OpenAPI API example",
        plugins: [
            uniformOpenAIMeta,
        ],
    },
    {
        name: "-3.random",
        description: "Random/scratch OpenAPI example",
    },
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
    },
    {
        name: "8.enums",
        description: "OpenAPI enums",
    }
]

describe("oapSchemaToReferences", {timeout: 60000}, () => {
    tests.forEach((test) => {
        it(`[${test.name}]: ${test.description}`, async () => {
            await testOasSchemaToReferences(test.name, test.options, test.plugins, test.url);
        });
    });
});
