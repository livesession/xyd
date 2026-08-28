import { describe, it, expect } from "vitest";

import type { Segment } from "@xyd-js/core";

import { resolveLogoTrailingSwitcher } from "../packages/react/utils/segmentLogoTrailing";

const productsSegment: Segment = {
    route: "/",
    title: "Products",
    appearance: "logoTrailing",
    trigger: "hover",
    pages: [
        { title: "Session Replay", page: "session-replay/intro", icon: "replay" },
        { title: "Web Analytics", page: "web-analytics/intro", icon: "chart" },
    ],
};

describe("resolveLogoTrailingSwitcher", () => {
    it("labels the trigger with the active page's title and checks only it", () => {
        const { triggerLabel, items } = resolveLogoTrailingSwitcher(
            productsSegment,
            "web-analytics/intro",
        );

        expect(triggerLabel).toBe("Web Analytics");
        expect(items.map((i) => i.active)).toEqual([false, true]);
        // hrefs resolved via pageLink
        expect(items.map((i) => i.href)).toEqual([
            "/session-replay/intro",
            "/web-analytics/intro",
        ]);
        expect(items.map((i) => i.title)).toEqual(["Session Replay", "Web Analytics"]);
    });

    it("falls back to the segment title when nothing is active", () => {
        const { triggerLabel, items } = resolveLogoTrailingSwitcher(productsSegment, "");
        expect(triggerLabel).toBe("Products");
        expect(items.every((i) => !i.active)).toBe(true);
    });

    it("falls back to the segment title when the active page is not one of its pages", () => {
        const { triggerLabel, items } = resolveLogoTrailingSwitcher(
            productsSegment,
            "some/other/page",
        );
        expect(triggerLabel).toBe("Products");
        expect(items.every((i) => !i.active)).toBe(true);
    });

    it("resolves a page's nested dropdownMenu into a submenu", () => {
        const segment: Segment = {
            route: "/",
            title: "Products",
            appearance: "logoTrailing",
            pages: [
                {
                    title: "Session Replay",
                    page: "session-replay/intro",
                    dropdownMenu: [
                        { title: "Overview", page: "session-replay/overview" },
                        { title: "API", href: "https://api.example.com" },
                    ],
                },
            ],
        };

        const { items } = resolveLogoTrailingSwitcher(segment, "session-replay/intro");

        expect(items).toHaveLength(1);
        expect(items[0].active).toBe(true);
        expect(items[0].items).toHaveLength(2);
        expect(items[0].items?.map((i) => i.href)).toEqual([
            "/session-replay/overview",
            "https://api.example.com",
        ]);
    });

    it("handles an empty segment gracefully", () => {
        const { triggerLabel, items } = resolveLogoTrailingSwitcher(
            { route: "/", title: "Products", appearance: "logoTrailing", pages: [] },
            "anything",
        );
        expect(triggerLabel).toBe("Products");
        expect(items).toEqual([]);
    });
});
