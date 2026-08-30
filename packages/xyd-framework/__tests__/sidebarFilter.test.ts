import { describe, it, expect } from "vitest";

import { sidebarItemMatchesQuery, type FilterableSidebarItem } from "../packages/react/utils/sidebarFilter";

const group: FilterableSidebarItem = {
    title: "Get started",
    items: [
        { title: "What is Nomad?" },
        { title: "Quickstart" },
        {
            title: "Architecture",
            items: [
                { title: "Cluster consensus" },
                { title: "Multi-region federation" },
            ],
        },
    ],
};

describe("sidebarItemMatchesQuery", () => {
    it("keeps everything when the query is empty (filter inactive)", () => {
        expect(sidebarItemMatchesQuery(group, "")).toBe(true);
        expect(sidebarItemMatchesQuery({ title: "Anything" }, "")).toBe(true);
    });

    it("matches a leaf on its own title", () => {
        expect(sidebarItemMatchesQuery({ title: "Quickstart" }, "quick")).toBe(true);
        expect(sidebarItemMatchesQuery({ title: "Quickstart" }, "vault")).toBe(false);
    });

    it("keeps a group when a descendant matches (even if the group title does not)", () => {
        expect(sidebarItemMatchesQuery(group, "consensus")).toBe(true);
        expect(sidebarItemMatchesQuery(group, "federation")).toBe(true);
    });

    it("drops a group when neither it nor any descendant matches", () => {
        expect(sidebarItemMatchesQuery(group, "billing")).toBe(false);
    });

    it("keeps a group when the group's own title matches", () => {
        expect(sidebarItemMatchesQuery(group, "get started")).toBe(true);
    });

    it("prefers sidebarTitle over title when present", () => {
        expect(sidebarItemMatchesQuery({ title: "Original", sidebarTitle: "Renamed" }, "renamed")).toBe(true);
        expect(sidebarItemMatchesQuery({ title: "Original", sidebarTitle: "Renamed" }, "original")).toBe(false);
    });
});
