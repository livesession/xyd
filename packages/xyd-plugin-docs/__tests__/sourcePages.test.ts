import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { Navigation } from "@xyd-js/core";
import { describe, expect, it } from "vitest";

import { mapNavigationToPagePathMapping, normalizeSourcePages, prefixSidebarPages } from "../src/index";

// `{ page, source }` — a page whose URL differs from its markdown file path.
// The sugar is normalized at boot into the long-supported `{ virtual, page }`
// form, so every walker (JS + Rust pagemaps, sidebar, docPaths, search, i18n)
// only ever sees the virtual shape. No process.chdir — the mapping builder
// takes an explicit cwd.

describe("normalizeSourcePages", () => {
    it("rewrites { page, source } leaves everywhere: route groups, nested groups, top level, i18n sidebars", () => {
        const nav: Navigation = {
            sidebar: [
                { page: "top/pretty", source: "top/file" } as any,
                {
                    route: "docs",
                    pages: [
                        {
                            group: "Logs",
                            pages: [
                                { page: "docs/angular/logs", source: "docs/logs.angular" },
                                { group: "Nested", pages: [{ page: "docs/bun/logs", source: "docs/logs.bun" }] },
                                "docs/plain",
                            ],
                        },
                    ],
                } as any,
            ],
            languages: [
                { language: "pl", sidebar: [{ route: "docs", pages: [{ page: "docs/a", source: "docs/b" }] }] } as any,
            ],
        };

        normalizeSourcePages(nav);

        expect(nav.sidebar![0]).toEqual({ page: "top/pretty", virtual: "top/file" });
        const group = (nav.sidebar![1] as any).pages[0];
        expect(group.pages[0]).toEqual({ page: "docs/angular/logs", virtual: "docs/logs.angular" });
        expect(group.pages[1].pages[0]).toEqual({ page: "docs/bun/logs", virtual: "docs/logs.bun" });
        expect(group.pages[2]).toBe("docs/plain"); // strings untouched
        expect((nav.languages![0].sidebar![0] as any).pages[0]).toEqual({ page: "docs/a", virtual: "docs/b" });
    });

    it("preserves extra props, leaves other shapes alone, and is idempotent", () => {
        const titledRef = { page: "docs/x", title: "X" }; // titled page ref — NOT a source page
        const rawVirtual = { virtual: ".cache/y", page: "docs/y" };
        const component = { component: "Foo", page: "p", source: "s" }; // component wins
        const nav: Navigation = {
            sidebar: [
                { route: "docs", pages: [{ page: "docs/z", source: "docs/z.file", title: "Z" }, titledRef, rawVirtual, component] } as any,
            ],
        };

        normalizeSourcePages(nav);
        const pages = (nav.sidebar![0] as any).pages;
        expect(pages[0]).toEqual({ page: "docs/z", virtual: "docs/z.file", title: "Z" });
        expect(pages[1]).toEqual({ page: "docs/x", title: "X" });
        expect(pages[2]).toEqual({ virtual: ".cache/y", page: "docs/y" });
        expect(pages[3]).toEqual({ component: "Foo", page: "p", source: "s" });

        const once = JSON.parse(JSON.stringify(nav));
        normalizeSourcePages(nav);
        expect(JSON.parse(JSON.stringify(nav))).toEqual(once);
    });
});

describe("mapNavigationToPagePathMapping with virtual/source pages", () => {
    it("maps the pretty URL to the real file (dotted stems survive extension probing)", () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), "xyd-sourcepages-"));
        try {
            fs.mkdirSync(path.join(dir, "docs"), { recursive: true });
            fs.writeFileSync(path.join(dir, "docs", "logs.angular.md"), "# Angular logs\n");
            fs.writeFileSync(path.join(dir, "docs", "titled.md"), "# Titled\n");

            const nav: Navigation = {
                sidebar: [{
                    route: "docs",
                    pages: [
                        { page: "docs/angular/logs", source: "docs/logs.angular" },
                        { page: "docs/missing/logs", source: "docs/logs.missing" },
                        { page: "docs/titled", title: "T" },
                        { page: "docs/ghost", title: "G" },
                    ],
                } as any],
            };
            normalizeSourcePages(nav);
            const mapping = mapNavigationToPagePathMapping(nav, dir);

            expect(mapping["docs/angular/logs"]).toBe("docs/logs.angular.md");
            expect(mapping["docs/missing/logs"]).toBeUndefined(); // no file → no entry
            expect(mapping["docs/logs.angular"]).toBeUndefined(); // the FILE path is not a URL
            // titled-ref-style leaf with a REAL file maps like a string entry;
            // one without a file (uniform-generated ref) stays unmapped
            expect(mapping["docs/titled"]).toBe("docs/titled.md");
            expect(mapping["docs/ghost"]).toBeUndefined();
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });
});

describe("prefixSidebarPages on normalized entries (i18n)", () => {
    it("locale-prefixes BOTH the file path and the URL", () => {
        const sidebar = [{
            route: "docs",
            pages: [{ page: "docs/angular/logs", source: "docs/logs.angular" }],
        }] as any[];
        normalizeSourcePages({ sidebar } as Navigation);
        prefixSidebarPages(sidebar, "pl/");

        expect(sidebar[0].route).toBe("/pl/docs");
        expect(sidebar[0].pages[0]).toEqual({
            page: "pl/docs/angular/logs",
            virtual: "pl/docs/logs.angular",
        });
    });
});
