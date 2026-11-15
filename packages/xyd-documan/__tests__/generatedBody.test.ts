import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { withGeneratedBody } from "../src/generatedBody";

// A page's `.md` twin (the file llms.txt links to) gets the command its `cli`
// frontmatter names, in every form the page itself reads.
const ACME = {
    opencli: "1.0.0",
    info: { title: "acme", version: "1.0.0" },
    commands: [
        {
            name: "login",
            description: "Sign in.",
            options: [{ name: "token", description: "A token to sign in with." }],
        },
        { name: "remote", description: "Manage remotes." },
    ],
};

describe("withGeneratedBody", () => {
    let dir: string;
    let cwd: string;

    beforeAll(() => {
        dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "generated-body-")));
        fs.mkdirSync(path.join(dir, "specs"));
        fs.mkdirSync(path.join(dir, "guides"));
        fs.writeFileSync(path.join(dir, "specs", "acme.opencli.json"), JSON.stringify(ACME));
        cwd = process.cwd();
        process.chdir(dir);
    });

    afterAll(() => {
        process.chdir(cwd);
        fs.rmSync(dir, { recursive: true, force: true });
    });

    const twin = (frontmatter: string, settings: any = {}) =>
        withGeneratedBody(`---\n${frontmatter}\n---\n`, path.join(dir, "guides", "page.md"), settings, new Map());

    it("writes the command after the frontmatter of a string value", async () => {
        const md = await twin("cli: ~/specs/acme.opencli.json#login");

        expect(md).toBe(
            "---\ncli: ~/specs/acme.opencli.json#login\n---\n\n" +
                "# login\n\nSign in.\n\n```shell\nacme login [options]\n```\n\n" +
                "## Options\n\n- `--token` (boolean): A token to sign in with.\n\n" +
                "## Examples\n\n```shell\nacme login\n```\n",
        );
    });

    it("reads the object form", async () => {
        const md = await twin("cli:\n  path: ~/specs/acme.opencli.json#login");

        expect(md).toContain("\n# login\n\nSign in.\n");
    });

    it("resolves an engine.paths alias and a comma-separated region list", async () => {
        const settings = { engine: { paths: { "@cli/*": ["specs/*"] } } };
        const md = await twin('cli: "@cli/acme.opencli.json#login,remote"', settings);

        expect(md.match(/^# .*$/gm)).toEqual(["# login", "# remote"]);
    });

    it("returns a page without a cli frontmatter, or naming no command, as it is", async () => {
        const plain = "---\ntitle: Guide\n---\n\nText.\n";
        expect(await withGeneratedBody(plain, path.join(dir, "guides", "page.md"), {} as any, new Map())).toBe(plain);
        expect(await twin("cli: ~/specs/acme.opencli.json#nope")).toBe("---\ncli: ~/specs/acme.opencli.json#nope\n---\n");
        expect(await twin("cli: 42")).toBe("---\ncli: 42\n---\n");
    });
});
