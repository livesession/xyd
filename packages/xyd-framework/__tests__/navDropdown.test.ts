import { describe, it, expect } from "vitest";

import type { NavigationItem } from "@xyd-js/core";

import {
    resolveDropdownItems,
    resolveDropdownHref,
} from "../packages/react/utils/navDropdown";

describe("resolveDropdownHref", () => {
    it("resolves a page to a routed link", () => {
        expect(resolveDropdownHref({ page: "docs/api/browser" })).toBe("/docs/api/browser");
    });

    it("keeps an href verbatim (external)", () => {
        expect(resolveDropdownHref({ href: "https://x.dev" })).toBe("https://x.dev");
    });

    it("prefers href over page", () => {
        expect(resolveDropdownHref({ href: "/a", page: "b" })).toBe("/a");
    });

    it("returns null for a menu-only (group) item", () => {
        expect(resolveDropdownHref({ title: "API" })).toBeNull();
    });
});

describe("resolveDropdownItems", () => {
    it("resolves a flat menu (api → Browser SDK / REST / GraphQL)", () => {
        const items: NavigationItem[] = [
            { title: "Browser SDK", page: "docs/api/browser" },
            { title: "REST API", page: "docs/api/rest" },
            { title: "GraphQL", href: "https://graphql.example.com" },
        ];

        expect(resolveDropdownItems(items)).toEqual([
            { title: "Browser SDK", description: undefined, href: "/docs/api/browser", value: "docs/api/browser", icon: undefined, items: undefined },
            { title: "REST API", description: undefined, href: "/docs/api/rest", value: "docs/api/rest", icon: undefined, items: undefined },
            { title: "GraphQL", description: undefined, href: "https://graphql.example.com", value: "https://graphql.example.com", icon: undefined, items: undefined },
        ]);
    });

    it("resolves multi-level submenus recursively", () => {
        const items: NavigationItem[] = [
            {
                title: "Browser SDK",
                dropdownMenu: [
                    { title: "Install", page: "docs/api/browser/install" },
                    {
                        title: "Methods",
                        dropdownMenu: [{ title: "identify", page: "docs/api/browser/identify" }],
                    },
                ],
            },
        ];

        const resolved = resolveDropdownItems(items);

        // Top level: a menu-only group with children, no own href.
        expect(resolved[0].title).toBe("Browser SDK");
        expect(resolved[0].href).toBeNull();
        expect(resolved[0].items).toHaveLength(2);

        // 2nd level.
        expect(resolved[0].items![0]).toMatchObject({
            title: "Install",
            href: "/docs/api/browser/install",
        });
        expect(resolved[0].items![0].items).toBeUndefined();

        // 3rd level (recursion).
        expect(resolved[0].items![1].title).toBe("Methods");
        expect(resolved[0].items![1].items).toHaveLength(1);
        expect(resolved[0].items![1].items![0]).toMatchObject({
            title: "identify",
            href: "/docs/api/browser/identify",
        });
    });

    it("handles an empty / undefined menu", () => {
        expect(resolveDropdownItems([])).toEqual([]);
        expect(resolveDropdownItems(undefined as any)).toEqual([]);
    });
});
