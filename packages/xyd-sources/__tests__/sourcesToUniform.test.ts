import {describe, it} from 'vitest'

import type {Test} from "./types";
import {testSourcesToUniform} from "./utils";

const TEST_DEBUG = true || Boolean(process.env.TEST_DEBUG);
const FORCE_SAVE = TEST_DEBUG || process.env.FORCE_SAFE === "true";
const SAVE_UNIFORM = TEST_DEBUG || process.env.SAVE_UNIFORM === "true";
const SAVE_TYPEDOC = TEST_DEBUG || process.env.SAVE_UNIFORM === "true";

const tests: Test[] = [
    // {
    //     id: "1.settings",
    //     file: "-1.typescript",
    //     description: "TypeScript: example",
    //     miniUniformRoot: "Settings",
    //     entryPoints: [
    //         "src/settings.ts"
    //     ],
    //     forceSave: FORCE_SAVE,
    //     saveUniform: SAVE_UNIFORM,
    //     saveTypedoc: SAVE_TYPEDOC,
    //     multiOutput: true
    // },
    {
        id: "1.settings",
        file: "-1.typescript",
        description: "TypeScript: example",
        miniUniformRoot: "Metadata",
        entryPoints: [
            "src/settings2.ts"
        ],
        forceSave: FORCE_SAVE,
        saveUniform: SAVE_UNIFORM,
        saveTypedoc: SAVE_TYPEDOC,
        multiOutput: true
    },

    // {
    //     id: "1.flat-interface",
    //     file: "-2.react.basic",
    //     description: "React basic: flat interface",
    //     react: true,
    //     entryPoints: [
    //         "src/1.flat-interface.tsx"
    //     ],
    //     forceSave: FORCE_SAVE,
    //     saveUniform: SAVE_UNIFORM,
    //     saveTypedoc: SAVE_TYPEDOC,
    //     multiOutput: true
    // },
    //
    // {
    //     id: "2.file-connect-interface",
    //     file: "-2.react.basic",
    //     description: "React basic: file connect interface",
    //     react: true,
    //     entryPoints: [
    //         "src/2.file-connect-interface.tsx"
    //     ],
    //     forceSave: FORCE_SAVE,
    //     saveUniform: SAVE_UNIFORM,
    //     saveTypedoc: SAVE_TYPEDOC,
    //     multiOutput: true
    // },
    // {
    //     id: "2a.file-connect-interface-advanced",
    //     file: "-2.react.basic",
    //     description: "React basic: file connect interface advanced",
    //     react: true,
    //     entryPoints: [
    //         "src/2a.file-connect-interace+advanced.tsx"
    //     ],
    //     forceSave: FORCE_SAVE,
    //     saveUniform: SAVE_UNIFORM,
    //     saveTypedoc: SAVE_TYPEDOC,
    //     multiOutput: true
    // },
    //
    // {
    //     id: "3.props-as-variants",
    //     file: "-2.react.basic",
    //     description: "React basic: props as variants",
    //     react: true,
    //     entryPoints: [
    //         "src/3.props-as-variants.tsx"
    //     ],
    //     forceSave: FORCE_SAVE,
    //     saveUniform: SAVE_UNIFORM,
    //     saveTypedoc: SAVE_TYPEDOC,
    //     multiOutput: true
    // },
    //
    // {
    //     id: "4.outside-interface",
    //     file: "-2.react.basic",
    //     description: "React basic: outside interface",
    //     react: true,
    //     entryPoints: [
    //         "src/4.outside-interface.tsx"
    //     ],
    //     forceSave: FORCE_SAVE,
    //     saveUniform: SAVE_UNIFORM,
    //     saveTypedoc: SAVE_TYPEDOC,
    //     multiOutput: true
    // },
    //
    // {
    //     id: "5.inline-props",
    //     file: "-2.react.basic",
    //     description: "React basic: inline props",
    //     react: true,
    //     entryPoints: [
    //         "src/5.inline-props.tsx"
    //     ],
    //     forceSave: FORCE_SAVE,
    //     saveUniform: SAVE_UNIFORM,
    //     saveTypedoc: SAVE_TYPEDOC,
    //     multiOutput: true
    // },
    // {
    //     id: "5a.inline-props+outside",
    //     file: "-2.react.basic",
    //     description: "React basic: inline props + outside",
    //     react: true,
    //     entryPoints: [
    //         "src/5a.inline-props+outside.tsx"
    //     ],
    //     forceSave: FORCE_SAVE,
    //     saveUniform: SAVE_UNIFORM,
    //     saveTypedoc: SAVE_TYPEDOC,
    //     multiOutput: true
    // },
    // {
    //     id: "5b.inline-props+interfaces",
    //     file: "-2.react.basic",
    //     description: "React basic: inline prop + interfaces",
    //     react: true,
    //     entryPoints: [
    //         "src/5b.inline-props+interfaces.tsx"
    //     ],
    //     forceSave: FORCE_SAVE,
    //     saveUniform: SAVE_UNIFORM,
    //     saveTypedoc: SAVE_TYPEDOC,
    //     multiOutput: true
    // },
]

describe("sourcesToUniform", () => {
    tests.forEach((test) => {
        it(`[${test.id} (${test.file})]: ${test.description}`, async () => {
            await testSourcesToUniform(test);
        });
    });
});
