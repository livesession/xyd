import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
    basenameDirs,
    basenameViteBase,
    normalizePathBase,
    relocateUnderBasename,
    renamePrerenderedRoutes,
} from "../src/buildOutput";

let dirs: string[] = [];

/** a client build dir with the given files (content = the relative path) */
function clientDir(files: string[]): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "xyd-build-output-"));
    dirs.push(dir);
    for (const rel of files) {
        const abs = path.join(dir, rel);
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, rel);
    }
    return dir;
}

/** sorted relative listing of every file under dir */
function tree(dir: string): string[] {
    const out: string[] = [];
    const walk = (d: string) => {
        for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
            const abs = path.join(d, entry.name);
            if (entry.isDirectory()) walk(abs);
            else out.push(path.relative(dir, abs).split(path.sep).join("/"));
        }
    };
    walk(dir);
    return out.sort();
}

afterEach(() => {
    for (const d of dirs) fs.rmSync(d, { recursive: true, force: true });
    dirs = [];
});

describe("basenameViteBase", () => {
    it("derives a directory base from the basename", () => {
        expect(basenameViteBase("/v3/atlas")).toBe("/v3/atlas/");
        expect(basenameViteBase("/docs/")).toBe("/docs/");
        expect(basenameViteBase("docs")).toBe("/docs/");
    });

    it("is undefined without a basename", () => {
        expect(basenameViteBase(undefined)).toBeUndefined();
        expect(basenameViteBase("")).toBeUndefined();
        expect(basenameViteBase("/")).toBeUndefined();
    });
});

describe("normalizePathBase", () => {
    it("normalizes an absolute-path base like Vite", () => {
        expect(normalizePathBase("/docs")).toBe("/docs/");
        expect(normalizePathBase("/v3/atlas/")).toBe("/v3/atlas/");
        expect(normalizePathBase("/")).toBe("/");
    });

    it("leaves a URL or protocol-relative base alone", () => {
        expect(normalizePathBase("https://cdn.example.com/docs")).toBe("https://cdn.example.com/docs");
        expect(normalizePathBase("//cdn.example.com/")).toBe("//cdn.example.com/");
    });
});

describe("basenameDirs", () => {
    it("lists the basename's directory chain", () => {
        expect(basenameDirs("/v3/atlas")).toEqual(["v3", "v3/atlas"]);
        expect(basenameDirs("/docs")).toEqual(["docs"]);
        expect(basenameDirs(undefined)).toEqual([]);
    });
});

describe("renamePrerenderedRoutes", () => {
    it("flattens <route>/index.html to <route>.html without a basename", () => {
        const dir = clientDir(["index.html", "docs/index.html", "docs/guides/intro/index.html", "assets/app.js"]);

        renamePrerenderedRoutes({ rootDir: dir });

        expect(tree(dir)).toEqual(["assets/app.js", "docs.html", "docs/guides/intro.html", "index.html"]);
    });

    it("keeps the basename's own index.html in place and flattens the routes under it", () => {
        const dir = clientDir([
            "v3/atlas/index.html",
            "v3/atlas/getBookByTitle/index.html",
            "v3/atlas/objects/Book/index.html",
            "v3/atlas/llms.txt",
        ]);

        renamePrerenderedRoutes({ rootDir: dir, basename: "/v3/atlas" });

        expect(tree(dir)).toEqual([
            "v3/atlas/getBookByTitle.html",
            "v3/atlas/index.html",
            "v3/atlas/llms.txt",
            "v3/atlas/objects/Book.html",
        ]);
        expect(fs.existsSync(path.join(dir, "v3", "atlas.html"))).toBe(false);
    });

    it("flattens a route named like a basename segment when it is not the mount", () => {
        const dir = clientDir(["docs/index.html", "docs/atlas/index.html"]);

        renamePrerenderedRoutes({ rootDir: dir, basename: "/docs" });

        expect(tree(dir)).toEqual(["docs/atlas.html", "docs/index.html"]);
    });

    it("skips an existing <route>.html instead of overwriting it", () => {
        const dir = clientDir(["docs.html", "docs/index.html"]);

        renamePrerenderedRoutes({ rootDir: dir });

        expect(fs.readFileSync(path.join(dir, "docs.html"), "utf-8")).toBe("docs.html");
        expect(fs.existsSync(path.join(dir, "docs", "index.html"))).toBe(true);
    });
});

describe("relocateUnderBasename", () => {
    it("moves the root-level Vite output under the basename, keeping .vite at the root", () => {
        const dir = clientDir([
            "assets/app.js",
            "assets/style.css",
            "__spa-fallback.html",
            ".vite/manifest.json",
            "v3/atlas/index.html",
            "v3/atlas/getBookByTitle.html",
        ]);

        const moved = relocateUnderBasename(dir, "/v3/atlas");

        expect(moved.sort()).toEqual(["__spa-fallback.html", "assets"]);
        expect(tree(dir)).toEqual([
            ".vite/manifest.json",
            "v3/atlas/__spa-fallback.html",
            "v3/atlas/assets/app.js",
            "v3/atlas/assets/style.css",
            "v3/atlas/getBookByTitle.html",
            "v3/atlas/index.html",
        ]);
    });

    it("merges into a directory a previous build left under the basename, fresh files winning", () => {
        const dir = clientDir([
            "assets/app-new.js",
            "assets/shared.css",
            "__spa-fallback.html",
            "docs/assets/app-old.js",
            "docs/assets/shared.css",
            "docs/__spa-fallback.html",
            "docs/index.html",
        ]);
        fs.writeFileSync(path.join(dir, "docs", "assets", "shared.css"), "stale");
        fs.writeFileSync(path.join(dir, "docs", "__spa-fallback.html"), "stale");

        const moved = relocateUnderBasename(dir, "/docs");

        expect(moved.sort()).toEqual(["__spa-fallback.html", "assets"]);
        expect(tree(dir)).toEqual([
            "docs/__spa-fallback.html",
            "docs/assets/app-new.js",
            "docs/assets/app-old.js",
            "docs/assets/shared.css",
            "docs/index.html",
        ]);
        expect(fs.readFileSync(path.join(dir, "docs", "assets", "shared.css"), "utf-8")).toBe("assets/shared.css");
        expect(fs.readFileSync(path.join(dir, "docs", "__spa-fallback.html"), "utf-8")).toBe("__spa-fallback.html");
    });

    it("does nothing without a basename", () => {
        const dir = clientDir(["assets/app.js", "index.html"]);

        expect(relocateUnderBasename(dir, "/")).toEqual([]);
        expect(tree(dir)).toEqual(["assets/app.js", "index.html"]);
    });
});
