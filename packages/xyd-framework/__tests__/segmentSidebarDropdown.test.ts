import { describe, it, expect } from "vitest";

import type { NavigationItem } from "@xyd-js/core";

import { flattenNavigationPages, findActiveNavigationPage } from "../packages/react/utils/segmentSidebarDropdown";

/**
 * Sidebar-dropdown nesting helpers: a NavigationItem inside a sidebarDropdown
 * segment (or the global `navigation.sidebarDropdown`) may declare nested
 * `pages` — an inline-expandable GROUP in the dropdown. Matching logic
 * flattens that nesting; for flat configs both helpers behave exactly like
 * the flat `findLast` they replaced.
 */

const NESTED: NavigationItem[] = [
    { title: "Guides", page: "docs/guides", icon: "book" },
    { title: "Reference", page: "docs/reference" },
    {
        title: "SDKs", icon: "package", pages: [
            { title: "JavaScript SDK", page: "docs/sdk/js" },
            { title: "Python SDK", page: "docs/sdk/py" },
        ],
    },
    {
        title: "Deployment", pages: [
            { title: "Docker", page: "docs/deploy/docker" },
            {
                title: "Cloud", pages: [
                    { title: "Kubernetes", page: "docs/deploy/k8s" },
                ],
            },
        ],
    },
];

describe("flattenNavigationPages", () => {
    it("is identity-shaped for flat configs (order preserved)", () => {
        const flat: NavigationItem[] = [
            { title: "A", page: "a" },
            { title: "B", page: "b" },
        ];
        expect(flattenNavigationPages(flat)).toEqual(flat);
    });

    it("flattens depth-first, parents before children", () => {
        expect(flattenNavigationPages(NESTED).map(i => i.title)).toEqual([
            "Guides", "Reference",
            "SDKs", "JavaScript SDK", "Python SDK",
            "Deployment", "Docker", "Cloud", "Kubernetes",
        ]);
    });

    it("handles undefined/empty", () => {
        expect(flattenNavigationPages(undefined)).toEqual([]);
        expect(flattenNavigationPages([])).toEqual([]);
    });
});

describe("findActiveNavigationPage", () => {
    it("matches a top-level leaf by route prefix", () => {
        expect(findActiveNavigationPage(NESTED, "/docs/guides/intro")?.title).toBe("Guides");
    });

    it("matches a NESTED leaf by route prefix", () => {
        expect(findActiveNavigationPage(NESTED, "/docs/sdk/py/quickstart")?.title).toBe("Python SDK");
        expect(findActiveNavigationPage(NESTED, "/docs/deploy/k8s/setup")?.title).toBe("Kubernetes");
    });

    it("group rows without a page never match", () => {
        // "/docs/sdk" is under no leaf prefix; SDKs itself has no `page`
        expect(findActiveNavigationPage(NESTED, "/docs/sdk")).toBeNull();
    });

    it("last declared match wins (findLast semantics)", () => {
        const overlapping: NavigationItem[] = [
            { title: "Docs", page: "docs" },
            { title: "SDK JS", pages: [{ title: "Deep", page: "docs/sdk/js" }] },
        ];
        expect(findActiveNavigationPage(overlapping, "/docs/sdk/js/intro")?.title).toBe("Deep");
    });

    it("no match → null", () => {
        expect(findActiveNavigationPage(NESTED, "/other/page")).toBeNull();
        expect(findActiveNavigationPage(undefined, "/docs/guides")).toBeNull();
    });
});
