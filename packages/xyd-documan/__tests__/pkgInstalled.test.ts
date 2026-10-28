import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { pkgInstalled } from "../src/bun/pkgInstalled";

let root: string;

function writePackage(dir: string, manifest: object, files: string[] = []) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, "package.json"), JSON.stringify(manifest));
    for (const file of files) {
        mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
        writeFileSync(path.join(dir, file), "");
    }
}

afterEach(() => {
    rmSync(root, { recursive: true, force: true });
});

describe("pkgInstalled", () => {
    const theme = { name: "@scope/theme", main: "dist/index.js", exports: { ".": { import: "./dist/index.js" } } };

    it("finds a built package in an enclosing node_modules", () => {
        root = mkdtempSync(path.join(tmpdir(), "pkg-installed-"));
        writePackage(path.join(root, "node_modules/@scope/theme"), theme, ["dist/index.js"]);
        expect(pkgInstalled(path.join(root, "project/.xyd/host"), "@scope/theme")).toBe(true);
    });

    it("does not count a package whose entry was never built", () => {
        root = mkdtempSync(path.join(tmpdir(), "pkg-installed-"));
        writePackage(path.join(root, "node_modules/@scope/theme"), theme);
        expect(pkgInstalled(path.join(root, "project/.xyd/host"), "@scope/theme")).toBe(false);
    });

    it("decides by the nearest copy, as the bundler resolves", () => {
        root = mkdtempSync(path.join(tmpdir(), "pkg-installed-"));
        const host = path.join(root, "project/.xyd/host");
        writePackage(path.join(root, "node_modules/@scope/theme"), theme); // unbuilt, farther
        writePackage(path.join(host, "node_modules/@scope/theme"), theme, ["dist/index.js"]); // built, nearer
        expect(pkgInstalled(host, "@scope/theme")).toBe(true);
    });

    it("reads string exports, main and the index.js default", () => {
        root = mkdtempSync(path.join(tmpdir(), "pkg-installed-"));
        writePackage(path.join(root, "node_modules/a"), { name: "a", exports: "./lib/a.js" }, ["lib/a.js"]);
        writePackage(path.join(root, "node_modules/b"), { name: "b", main: "b.js" }, ["b.js"]);
        writePackage(path.join(root, "node_modules/c"), { name: "c" }, ["index.js"]);
        writePackage(path.join(root, "node_modules/d"), { name: "d", main: "missing.js" });
        expect(["a", "b", "c", "d", "e"].map((name) => pkgInstalled(root, name))).toEqual([true, true, true, false, false]);
    });
});
