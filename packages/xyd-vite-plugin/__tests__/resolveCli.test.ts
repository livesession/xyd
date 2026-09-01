import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resolveCli } from "../src/resolveCli";

let dirs: string[] = [];
function tmpDir(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "xyd-vite-plugin-cli-"));
    dirs.push(dir);
    return dir;
}

/** Host project root with a fake CLI package installed under node_modules. */
function hostWithPackage(pkgName: string, bin: string | Record<string, string>): string {
    const host = tmpDir();
    fs.writeFileSync(path.join(host, "package.json"), JSON.stringify({ name: "host", private: true }));
    const pkgDir = path.join(host, "node_modules", pkgName);
    fs.mkdirSync(pkgDir, { recursive: true });
    fs.writeFileSync(path.join(pkgDir, "package.json"), JSON.stringify({ name: pkgName, version: "0.0.0", bin }));
    fs.writeFileSync(path.join(pkgDir, "index.js"), "// fake cli");
    fs.mkdirSync(path.join(pkgDir, "dist"), { recursive: true });
    fs.writeFileSync(path.join(pkgDir, "dist", "index.js"), "// fake cli");
    return host;
}

const savedPath = process.env.PATH;
beforeEach(() => {
    // an empty PATH so the machine's real `xyd` install can't leak into the tiers under test
    process.env.PATH = tmpDir();
});
afterEach(() => {
    process.env.PATH = savedPath;
    for (const d of dirs) fs.rmSync(d, { recursive: true, force: true });
    dirs = [];
});

describe("resolveCli", () => {
    it("the command option wins and passes through verbatim", () => {
        const r = resolveCli(["bunx", "xyd-js@1.0.0"], tmpDir());
        expect(r).toEqual({ argv: ["bunx", "xyd-js@1.0.0"], source: "command option" });
    });

    it("resolves a local xyd-js install via its bin.xyd", () => {
        const host = hostWithPackage("xyd-js", { xyd: "index.js" });
        const r = resolveCli(undefined, host);
        expect(r.source).toBe("local xyd-js");
        expect(r.argv[0]).toBe(process.execPath);
        // realpathSync: require.resolve returns realpaths (macOS /var -> /private/var)
        expect(r.argv[1]).toBe(fs.realpathSync(path.join(host, "node_modules", "xyd-js", "index.js")));
    });

    it("falls back to a local @xyd-js/cli install", () => {
        const host = hostWithPackage("@xyd-js/cli", { xyd: "dist/index.js" });
        const r = resolveCli(undefined, host);
        expect(r.source).toBe("local @xyd-js/cli");
        expect(r.argv[1]).toBe(fs.realpathSync(path.join(host, "node_modules", "@xyd-js", "cli", "dist", "index.js")));
    });

    it("falls back to an `xyd` executable on PATH", function () {
        if (process.platform === "win32") return;
        const binDir = tmpDir();
        const xyd = path.join(binDir, "xyd");
        fs.writeFileSync(xyd, "#!/bin/sh\n");
        fs.chmodSync(xyd, 0o755);
        process.env.PATH = binDir;
        const r = resolveCli(undefined, tmpDir());
        expect(r).toEqual({ argv: [xyd], source: "PATH" });
    });

    it("throws an actionable error when nothing resolves", () => {
        expect(() => resolveCli(undefined, tmpDir())).toThrowError(/could not find the xyd CLI/);
    });
});
