import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as ReactJsxRuntime from "react/jsx-runtime";
import { afterEach, describe, expect, it } from "vitest";

import { jsxDevRuntimeFor } from "../src/bun/jsxDevRuntime";

// The self-contained binary builds a project's own components (sidebar
// `{ component }` items, MDX components) into separate chunks that take React
// from the registry the prebuilt bundles fill (federationRegistry.ts). The
// prebuilt client is React's production build, whose `react/jsx-dev-runtime`
// exports `jsxDEV` as undefined: a chunk that calls it throws on hydration and
// React unmounts the whole page.

const FEDERATION = path.resolve(__dirname, "../src/bun/userComponentsFederation.ts");
const hasBun = spawnSync("bun", ["--version"]).status === 0;

let dirs: string[] = [];
afterEach(() => {
    for (const d of dirs) fs.rmSync(d, { recursive: true, force: true });
    dirs = [];
});

describe.skipIf(!hasBun)("the federated user-components chunks", () => {
    it("call jsx and jsxs, which every React build provides, never jsxDEV", () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), "xyd-federation-"));
        dirs.push(dir);
        fs.writeFileSync(
            path.join(dir, "Widget.tsx"),
            `export default function Widget() {\n` +
                `  return <div part="widget"><strong>Pinned</strong> <span>widget</span></div>;\n` +
                `}\n`
        );
        const script = path.join(dir, "build.ts");
        fs.writeFileSync(
            script,
            `import { buildUserComponentsClient, buildUserComponentsServer } from ${JSON.stringify(FEDERATION)};\n` +
                `const components = [{ name: "./Widget", importPath: ${JSON.stringify(path.join(dir, "Widget.tsx"))} }];\n` +
                `const client = await buildUserComponentsClient(components, ${JSON.stringify(path.join(dir, "client"))});\n` +
                `const server = await buildUserComponentsServer(components, ${JSON.stringify(path.join(dir, "server"))});\n` +
                `console.log(JSON.stringify({ client: client.absPath, server }));\n`
        );
        // The binary runs with no NODE_ENV (the test runner sets one).
        const env = { ...process.env };
        delete env.NODE_ENV;
        const run = spawnSync("bun", [script], { cwd: dir, env, encoding: "utf8" });
        expect(run.status, run.stderr).toBe(0);

        const out = JSON.parse(run.stdout.trim().split("\n").pop()!);
        for (const chunk of [out.client, out.server]) {
            const code = fs.readFileSync(chunk, "utf8");
            expect(code, chunk).not.toContain("jsxDEV");
            expect(code, chunk).not.toContain("react/jsx-dev-runtime");
            expect(code, chunk).toContain("react/jsx-runtime");
        }
    });
});

describe("the registry's react/jsx-dev-runtime", () => {
    const element = (e: any) => ({ type: e.type, key: e.key, props: e.props });

    it("is React's own when it has jsxDEV (a development build)", () => {
        const dev = { Fragment: Symbol.for("react.fragment"), jsxDEV: () => null };
        expect(jsxDevRuntimeFor(dev, ReactJsxRuntime)).toBe(dev);
    });

    it("stands in jsx and jsxs for the undefined jsxDEV of a production build", () => {
        const production = { Fragment: ReactJsxRuntime.Fragment, jsxDEV: undefined };
        const runtime = jsxDevRuntimeFor(production, ReactJsxRuntime);

        expect(typeof runtime.jsxDEV).toBe("function");
        expect(runtime.Fragment).toBe(ReactJsxRuntime.Fragment);
        expect(element(runtime.jsxDEV("b", { children: "x" }, "k", false))).toEqual(
            element(ReactJsxRuntime.jsx("b", { children: "x" }, "k"))
        );
        const children = [ReactJsxRuntime.jsx("i", {}, "a"), ReactJsxRuntime.jsx("i", {}, "b")];
        expect(element(runtime.jsxDEV("p", { children }, undefined, true))).toEqual(
            element(ReactJsxRuntime.jsxs("p", { children }))
        );
    });
});
