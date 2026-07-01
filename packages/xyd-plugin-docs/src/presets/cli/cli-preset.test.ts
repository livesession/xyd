import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { cliPreset } from "./index";

// Reproduce the real page-generation flow: a docs project with `api.cli` should
// produce one virtual page per command + add them to the `docs/cli` sidebar.
describe("cli preset → virtual pages + sidebar", () => {
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
    });
});
