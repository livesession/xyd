import { describe, it, expect } from "vitest";

import { sidebarActivePath, type SidebarPathItem } from "../packages/react/utils/sidebarActivePath";

// One top-level group's items as the hydration maps them: pages carry their
// href, a nested group's row carries `href: ""` and its pages under `items`.
const SECTION: SidebarPathItem[] = [
    {
        href: "",
        items: [
            { href: "/pets/list" },
            { href: "/pets/create" },
        ],
    },
    {
        href: "",
        items: [
            { href: "/store/orders/create" },
            {
                href: "",
                items: [{ href: "/store/inventory/get" }],
            },
        ],
    },
];

describe("sidebarActivePath", () => {
    it("finds the index path of the current page, one index per level", () => {
        expect(sidebarActivePath(SECTION, "/pets/create")).toEqual([0, 1]);
        expect(sidebarActivePath(SECTION, "/store/inventory/get")).toEqual([1, 1, 0]);
    });

    it("finds nothing for a page that is not in the group", () => {
        expect(sidebarActivePath(SECTION, "/users/list")).toBeNull();
    });

    it("never matches a row without an href — the site root opens no group", () => {
        // the root's path trims to "" — the nested groups' rows carry "" too
        expect(sidebarActivePath(SECTION, "")).toBeNull();
        // a custom-component row has no href either
        expect(sidebarActivePath([{ href: "" }, { href: "/about" }], "")).toBeNull();
    });

    it("matches the whole href, never a prefix shared with another group's pages", () => {
        const groups: SidebarPathItem[][] = [
            [{ href: "", items: [{ href: "/store" }, { href: "/store/orders" }] }],
            [{ href: "", items: [{ href: "/store/orders/create" }] }],
        ];
        expect(sidebarActivePath(groups[0], "/store/orders/create")).toBeNull();
        expect(sidebarActivePath(groups[1], "/store/orders/create")).toEqual([0, 0]);
        expect(sidebarActivePath(groups[1], "/store/orders")).toBeNull();
        expect(sidebarActivePath(groups[0], "/store/orders")).toEqual([0, 1]);
    });

    it("handles a group without items", () => {
        expect(sidebarActivePath(undefined, "/pets/list")).toBeNull();
        expect(sidebarActivePath([], "/pets/list")).toBeNull();
    });
});
