import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import type { Navigation } from "@xyd-js/core";

import { collectAsTocPages, mergeAsTocPages, asTocFileMap, sectionIdFor, mapNavigationToPagePathMapping } from "../src";

/**
 * sidebar-as-TOC data plane:
 * - collectAsTocPages walks the navigation (mirroring the pagemap traversal)
 *   and records every `asToc: true` group's pages as sections of their host
 *   page ("index" for top-level groups, the route slug under a SidebarRoute).
 * - mapNavigationToPagePathMapping must EXCLUDE those pages (non-routable),
 *   byte-parity with the Rust gate in crates/xyd_settings/src/pagemap.rs.
 *
 * Tests probe files in a tmp workspace via the walks' explicit `cwd` option
 * (md-wins-over-mdx, missing-file skip) — deterministic and chdir-free.
 */
describe("sidebar-as-TOC", () => {
    let tmpDir: string;

    // NO process.chdir here — it is unsupported in vitest worker threads
    // (xyd-content's package-local vitest 1.x runs the threads pool). The
    // walks take an explicit cwd instead, matching the Rust port's signature.
    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "xyd-astoc-test-"));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    function write(rel: string, content = "# x\n") {
        const abs = path.join(tmpDir, rel);
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, content);
    }

    const nav = (sidebar: any[]): Navigation => ({ sidebar }) as Navigation;

    describe("sectionIdFor", () => {
        it("slugs a page path deterministically", () => {
            expect(sectionIdFor("operating-systems/linux")).toBe("operating-systems-linux");
            expect(sectionIdFor("./docs/a/b")).toBe("docs-a-b");
        });
    });

    describe("collectAsTocPages", () => {
        it("collects a top-level asToc group under the index host", () => {
            write("os/linux.md");
            write("os/windows.md");

            const res = collectAsTocPages(nav([
                { group: "OS", asToc: true, pages: ["os/linux", "os/windows"] },
                { group: "Normal", pages: ["other"] },
            ]), { cwd: tmpDir });

            expect(Object.keys(res.hosts)).toEqual(["index"]);
            expect(res.hosts["index"].indexFile).toBe("");
            expect(res.hosts["index"].sections).toEqual([
                { page: "os/linux", file: "os/linux.md", id: "os-linux" },
                { page: "os/windows", file: "os/windows.md", id: "os-windows" },
            ]);
            expect(res.pages["os/linux"]).toEqual({ host: "index", id: "os-linux", indicator: true, breadcrumbs: true });
        });

        it("records the host's own intro file when present (md wins over mdx)", () => {
            write("index.mdx");
            write("index.md");
            write("os/linux.md");

            const res = collectAsTocPages(nav([
                { group: "OS", asToc: true, pages: ["os/linux"] },
            ]), { cwd: tmpDir });

            expect(res.hosts["index"].indexFile).toBe("index.md");
        });

        it("silently skips missing section files (pagemap parity)", () => {
            write("os/linux.md");

            const res = collectAsTocPages(nav([
                { group: "OS", asToc: true, pages: ["os/linux", "os/missing"] },
            ]), { cwd: tmpDir });

            expect(res.hosts["index"].sections.map(s => s.page)).toEqual(["os/linux"]);
            expect(res.pages["os/missing"]).toBeUndefined();
        });

        it("uses the route slug as host for groups under a SidebarRoute", () => {
            write("docs.md");
            write("docs/deep/a.md");

            const res = collectAsTocPages(nav([
                {
                    route: "/docs",
                    pages: [{ group: "Deep", asToc: true, pages: ["docs/deep/a"] }],
                },
            ]), { cwd: tmpDir });

            expect(Object.keys(res.hosts)).toEqual(["docs"]);
            expect(res.hosts["docs"].indexFile).toBe("docs.md");
            expect(res.pages["docs/deep/a"]).toEqual({ host: "docs", id: "docs-deep-a", indicator: true, breadcrumbs: true });
        });

        it("finds asToc groups nested inside normal groups and flattens nested subgroups", () => {
            write("a/x.md");
            write("a/y.md");

            const res = collectAsTocPages(nav([
                {
                    group: "Outer",
                    pages: [
                        "outer-page",
                        {
                            group: "Inner", asToc: true, pages: [
                                "a/x",
                                { group: "Sub", pages: ["a/y"] },
                            ]
                        },
                    ],
                },
            ]), { cwd: tmpDir });

            expect(res.hosts["index"].sections.map(s => s.page)).toEqual(["a/x", "a/y"]);
        });

        it("prefixes the top-level host in i18n mode", () => {
            write("pl/os/linux.md");

            const res = collectAsTocPages(
                nav([{ group: "OS", asToc: true, pages: ["pl/os/linux"] }]),
                { hostPrefix: "pl/", cwd: tmpDir }
            );

            expect(Object.keys(res.hosts)).toEqual(["pl/index"]);
        });

        it("keeps walk order across multiple asToc groups sharing a host", () => {
            write("os/linux.md");
            write("lang/python.md");

            const res = collectAsTocPages(nav([
                { group: "OS", asToc: true, pages: ["os/linux"] },
                { group: "Resources", pages: [] },
                { group: "Lang", asToc: true, pages: ["lang/python"] },
            ]), { cwd: tmpDir });

            expect(res.hosts["index"].sections.map(s => s.id)).toEqual(["os-linux", "lang-python"]);
        });

        it("object form enables and resolves options; false disables", () => {
            write("os/linux.md");
            write("lang/python.md");
            write("off/page.md");

            const res = collectAsTocPages(nav([
                { group: "OS", asToc: {}, pages: ["os/linux"] },
                { group: "Lang", asToc: { indicator: false, breadcrumbs: false }, pages: ["lang/python"] },
                { group: "Off", asToc: false, pages: ["off/page"] },
            ]), { cwd: tmpDir });

            expect(res.pages["os/linux"]).toEqual({ host: "index", id: "os-linux", indicator: true, breadcrumbs: true });
            expect(res.pages["lang/python"]).toEqual({ host: "index", id: "lang-python", indicator: false, breadcrumbs: false });
            expect(res.pages["off/page"]).toBeUndefined();
        });
    });

    describe("mergeAsTocPages / asTocFileMap", () => {
        it("merges hosts and builds the flat file map", () => {
            const a = {
                hosts: { index: { indexFile: "", sections: [{ page: "x", file: "x.md", id: "x" }] } },
                pages: { x: { host: "index", id: "x", indicator: true, breadcrumbs: true } },
            };
            const b = {
                hosts: { index: { indexFile: "index.md", sections: [{ page: "y", file: "y.md", id: "y" }] } },
                pages: { y: { host: "index", id: "y", indicator: true, breadcrumbs: true } },
            };
            const merged = mergeAsTocPages(a, b);
            expect(merged.hosts["index"].sections.map(s => s.page)).toEqual(["x", "y"]);
            expect(merged.hosts["index"].indexFile).toBe("index.md");
            expect(asTocFileMap(merged)).toEqual({ x: "x.md", y: "y.md" });
        });
    });

    describe("mapNavigationToPagePathMapping gate", () => {
        it("excludes asToc pages at all three walk points (files exist!)", () => {
            write("index.md");
            write("normal.md");
            write("os/linux.md");
            write("nested/inner.md");
            write("guides/welcome.md");
            write("guides/routed.md");

            const mapping = mapNavigationToPagePathMapping(nav([
                {
                    group: "Docs", pages: [
                        "normal",
                        { group: "NestedToc", asToc: true, pages: ["nested/inner"] },
                    ]
                },
                { group: "TopToc", asToc: true, pages: ["os/linux"] },
                { group: "ObjectToc", asToc: { indicator: false }, pages: ["nested/inner"] },
                {
                    route: "/guides", pages: [
                        { group: "G", pages: ["guides/welcome"] },
                        { group: "RoutedToc", asToc: true, pages: ["guides/routed"] },
                    ]
                },
            ]) as any, tmpDir);

            expect(mapping).toEqual({
                "normal": "normal.md",
                "guides/welcome": "guides/welcome.md",
            });
        });
    });
});
