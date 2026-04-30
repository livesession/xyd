import {describe, it} from "vitest";

import {testConverters} from "./utils";

const tests = [
    {name: "1.converters.basic", description: "Basic REST endpoint (Update user)"},
    {name: "1.converters.advanced", description: "Advanced union/enum types (OpenAI)"},
    {name: "1.converters.advanced-livesession", description: "Advanced LiveSession API"},
];

describe("uniformToInputJsonSchema", () => {
    for (const t of tests) {
        it(t.description, async () => {
            await testConverters(t.name);
        });
    }
});