import {describe, it} from 'vitest'

import type {Test} from "./utils";
import {testSourcesToUniform} from "./utils";

const tests: Test[] = [
    {
        name: "-1.typescript.xyd-settings",
        description: "TypeScript: Settings interface",
        entryPoints: ["src/settings.ts"],
        mode: {type: "miniUniform", root: "Settings"},
    },
    {
        name: "-1.typescript.functions",
        description: "TypeScript: functions/callbacks as properties",
        entryPoints: ["src/functions.ts"],
        mode: {type: "miniUniform", root: "EventSystemConfig"},
    },
    {
        name: "-1.typescript.react",
        description: "TypeScript: React component (TestBasic)",
        entryPoints: ["src/TestBasic.tsx"],
        mode: {type: "react"},
    },
    {
        name: "-2.react.file-connect-interface",
        description: "React: file-scoped type alias in props",
        entryPoints: ["src/GuideCard.tsx"],
        mode: {type: "react"},
    },
    {
        name: "-2.react.functions",
        description: "React: function/callback props",
        entryPoints: ["src/DataGrid.tsx"],
        mode: {type: "react"},
    },
    {
        name: "-2.react.file-connect-interface-advanced",
        description: "React: interface with multiple type aliases",
        entryPoints: ["src/Text.tsx"],
        mode: {type: "react"},
    },
    {
        name: "-2.react.flat-interface",
        description: "React: flat interface props",
        entryPoints: ["src/GuideCard.tsx"],
        mode: {type: "react"},
    },
    {
        name: "-2.react.inline-props",
        description: "React: inline destructured props",
        entryPoints: ["src/GuideCard.tsx"],
        mode: {type: "react"},
    },
    {
        name: "-2.react.inline-props+interfaces",
        description: "React: inline destructured props with interfaces",
        entryPoints: ["src/Text.tsx"],
        mode: {type: "react"},
    },
    {
        name: "-2.react.inline-props+outside",
        description: "React: inline destructured props with imported type",
        entryPoints: ["src/GuideCard.tsx"],
        mode: {type: "react"},
    },
    {
        name: "-2.react.outside-interface",
        description: "React: props imported from separate file",
        entryPoints: ["src/GuideCard.tsx"],
        mode: {type: "react"},
    },
    {
        name: "-2.react.props-as-variants",
        description: "React: discriminated union props (variants)",
        entryPoints: ["src/Details.tsx"],
        mode: {type: "react"},
    },
];

describe("sourcesToUniform", () => {
    for (const t of tests) {
        it(t.description, async () => {
            await testSourcesToUniform(t);
        });
    }
});