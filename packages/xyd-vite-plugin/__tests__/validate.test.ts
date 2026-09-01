import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { preValidateBasename } from "../src/index";

let dirs: string[] = [];
function docsProject(settings: object | null): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "xyd-vite-plugin-validate-"));
    dirs.push(dir);
    if (settings) fs.writeFileSync(path.join(dir, "docs.json"), JSON.stringify(settings));
    else fs.writeFileSync(path.join(dir, "docs.ts"), "export default {}");
    return dir;
}

afterEach(() => {
    for (const d of dirs) fs.rmSync(d, { recursive: true, force: true });
    dirs = [];
});

describe("preValidateBasename", () => {
    it("errors when docs.json has no advanced.basename AND no base option", () => {
        const dir = docsProject({ navigation: {} });
        expect(() => preValidateBasename(dir, undefined)).toThrowError(/base.*option|advanced\.basename/);
    });

    it("accepts a missing advanced.basename when base supplies the mount (via XYD_BASENAME)", () => {
        const dir = docsProject({ navigation: {} });
        expect(() => preValidateBasename(dir, "/docs")).not.toThrow();
    });

    it("errors when base does not match advanced.basename", () => {
        const dir = docsProject({ advanced: { basename: "/help" } });
        expect(() => preValidateBasename(dir, "/docs")).toThrowError(/does not match/);
    });

    it("accepts a matching base (with slash normalization)", () => {
        const dir = docsProject({ advanced: { basename: "/docs" } });
        expect(() => preValidateBasename(dir, "/docs")).not.toThrow();
    });

    it("accepts a basename with no base option", () => {
        const dir = docsProject({ advanced: { basename: "/docs" } });
        expect(() => preValidateBasename(dir, undefined)).not.toThrow();
    });

    it("stays silent for docs.ts settings (post-build validation covers those)", () => {
        const dir = docsProject(null);
        expect(() => preValidateBasename(dir, "/docs")).not.toThrow();
    });
});
