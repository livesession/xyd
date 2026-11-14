import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { cliPreset } from "./index";

// This preset reaches `pluginNavigation` from @xyd-js/uniform, which is
// NATIVE-ONLY: its src/impl-js was deleted, so it THROWS without
// @xyd-js/native rather than falling back to JS. Two runners legitimately have
// no addon — tests-unit.yml, which never builds one, and the XYD_NATIVE=0
// differential leg — and this flow cannot run in either.
//
// The gate is on the whole describe rather than the package being excluded from
// the root vitest config, because the REST of xyd-plugin-docs' suite needs no
// addon and would lose its coverage. The ffi job in tests-native.yml builds the
// .node and runs this for real.
//
// Worth noting what this test is the canary for: every non-openapi api.* source
// (cli, graphql, mcp) reaches pluginNavigation unconditionally, so it is the
// one unit test that fails when the addon is missing. An openapi-only check
// passes regardless — the fused path rescues it — which is exactly why this is
// the file that caught it.
const nativeUnavailable = (() => {
    if (process.env.XYD_NATIVE === "0") return true;
    try {
        const native = createRequire(import.meta.url)("@xyd-js/native");
        return typeof native?.pluginNavigation !== "function";
    } catch {
        return true;
    }
})();

// Reproduce the real page-generation flow: a docs project with `api.cli` should
// produce one virtual page per command + add them to the `docs/cli` sidebar.
describe.skipIf(nativeUnavailable)("cli preset → virtual pages + sidebar", () => {
    let dir: string;
    let prevCwd: string;

    beforeAll(() => {
        prevCwd = process.cwd();
        dir = fs.mkdtempSync(path.join(os.tmpdir(), "cli-preset-"));
        fs.writeFileSync(
            path.join(dir, "spice.opencli.json"),
            JSON.stringify({
                opencli: "1.0.0",
                info: { title: "spice", version: "1.0.0" },
                commands: [
                    { name: "install", description: "Install packages.", arguments: [{ name: "packages", required: true }], options: [{ name: "global" }] },
                    { name: "remove", description: "Remove packages." },
                    { name: "list", description: "List packages." },
                ],
            }),
        );
        process.chdir(dir);
    });

    afterAll(() => {
        process.chdir(prevCwd);
        fs.rmSync(dir, { recursive: true, force: true });
    });

    it("generates a page per command and puts them in the sidebar", async () => {
        const settings: any = {
            api: { cli: [{ source: "spice.opencli.json", route: "docs/cli" }] },
            navigation: {
                sidebar: [
                    { route: "docs/cli", pages: [{ group: "spice CLI", pages: ["docs/cli/overview"] }] },
                ],
            },
        };

        const preset = cliPreset(settings, {});
        for (const pre of preset.preinstall || []) {
            await pre({})(settings, { routes: preset.routes });
        }

        const sidebarJson = JSON.stringify(settings.navigation.sidebar);
        const genDir = path.join(dir, ".xyd/.cache/.content/docs/cli");
        const genFiles = fs.existsSync(genDir) ? fs.readdirSync(genDir) : [];
        // eslint-disable-next-line no-console
        console.log("SIDEBAR:", sidebarJson);
        // eslint-disable-next-line no-console
        console.log("GENERATED:", genFiles);

        // The three command pages should be generated as virtual .md ...
        expect(genFiles.sort()).toEqual(["install.md", "list.md", "remove.md"]);
        // ... and appear in the sidebar.
        expect(sidebarJson).toContain("docs/cli/install");
        expect(sidebarJson).toContain("docs/cli/remove");
        expect(sidebarJson).toContain("docs/cli/list");

        // A page names its document relative to the docs root, never by the
        // absolute path of the directory it was built in: the frontmatter is
        // published with the page (its payload and its `.md` twin).
        const install = fs.readFileSync(path.join(genDir, "install.md"), "utf8");
        expect(install).toMatch(/^cli: ['"]?~\/spice\.opencli\.json#install['"]?$/m);
        expect(install).not.toContain(dir);
        expect(install).not.toContain(fs.realpathSync(dir));
    });
});

// `api.cli[..].options.globalOptionsPerCommand` decides where the CLI's global
// options go: one "Global options" page in the navigation (the default), or a
// section on every command page and no page of their own. The page step reads
// the same option (see the uniform processor's CLI test).
describe.skipIf(nativeUnavailable)("cli preset → the global options page", () => {
    let dir: string;
    let prevCwd: string;

    beforeAll(() => {
        prevCwd = process.cwd();
        dir = fs.mkdtempSync(path.join(os.tmpdir(), "cli-preset-globals-"));
        fs.writeFileSync(
            path.join(dir, "acme.opencli.json"),
            JSON.stringify({
                opencli: "1.0.0",
                info: { title: "acme", version: "1.0.0" },
                options: [{ name: "verbose", recursive: true, description: "Print more output." }],
                commands: [
                    { name: "init", description: "Create a new acme project." },
                    { name: "deploy", description: "Deploy the current project." },
                ],
            }),
        );
        process.chdir(dir);
    });

    afterAll(() => {
        process.chdir(prevCwd);
        fs.rmSync(dir, { recursive: true, force: true });
    });

    async function generate(options?: { globalOptionsPerCommand?: boolean }) {
        fs.rmSync(path.join(dir, ".xyd"), { recursive: true, force: true });
        const settings: any = {
            api: { cli: [{ source: "./acme.opencli.json", route: "cli", ...(options ? { options } : {}) }] },
            navigation: { sidebar: [] },
        };
        const preset = cliPreset(settings, {});
        for (const pre of preset.preinstall || []) {
            await pre({})(settings, { routes: preset.routes });
        }
        return fs.readdirSync(path.join(dir, ".xyd/.cache/.content/cli")).sort();
    }

    it("gives them a page of their own by default", async () => {
        expect(await generate()).toEqual(["deploy.md", "global-options.md", "init.md"]);
        expect(await generate({ globalOptionsPerCommand: false })).toEqual(["deploy.md", "global-options.md", "init.md"]);
    });

    it("gives them no page with globalOptionsPerCommand", async () => {
        expect(await generate({ globalOptionsPerCommand: true })).toEqual(["deploy.md", "init.md"]);
    });
});
