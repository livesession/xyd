import {describe, it} from "vitest";

import {testPluginJsonView} from "./utils";

const tests = [
    {name: "2.plugin-json-view.quoted-examples", description: "Quoted example values"},
    {name: "2.plugin-json-view.unquoted-examples", description: "Unquoted example values"},
    {name: "2.plugin-json-view.reordered-props", description: "Reordered properties with trailing comma"},
];

describe("pluginJsonView", () => {
    for (const t of tests) {
        it(t.description, async () => {
            await testPluginJsonView(t.name);
        });
    }
});