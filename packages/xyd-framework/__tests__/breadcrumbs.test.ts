import { describe, it, expect } from "vitest";

import type { Navigation, MetadataMap } from "@xyd-js/core";

import { resolveBreadcrumbs } from "../packages/hydration/breadcrumbs";
import { displayBreadcrumbs } from "../packages/react/utils/breadcrumbs";

// route "guides" (labelled by the tab "Guides") → group "Customization" (plain, no route)
// and a group-with-page "Integrations" (the Group-Page feature) → analytics page.
const navigation = {
    tabs: [{ title: "Guides", page: "guides" }],
    sidebar: [
        {
            route: "guides",
            pages: [
                { group: "Customization", pages: ["guides/customization-quickstart", "guides/appearance"] },
                { group: "Integrations", page: "guides/integrations", pages: ["guides/integrations/analytics"] },
            ],
        },
        {
            // a second route WITHOUT a tab → label falls back to the Title-Cased segment
            route: "reference",
            pages: [{ group: "Core", pages: ["reference/core"] }],
        },
    ],
} as unknown as Navigation;

const frontmatters: MetadataMap = {
    "guides/appearance": { title: "Appearance" },
    "guides/integrations/analytics": { title: "Analytics" },
    "reference/core": { title: "Core" },
} as any;

const crumbs = (slug: string) => resolveBreadcrumbs(navigation, slug, frontmatters, {});

describe("resolveBreadcrumbs", () => {
    it("includes the top-level tab/route crumb (the bug: 'Guides' was dropped)", () => {
        const bc = crumbs("guides/appearance");
        expect(bc.map((c) => c.title)).toEqual(["Guides", "Customization", "Appearance"]);
    });

    it("gives the root (tab) a real href and the current page a real href", () => {
        const bc = crumbs("guides/appearance");
        expect(bc[0]).toEqual({ title: "Guides", href: "/guides" }); // clickable (tab route)
        expect(bc[2]).toEqual({ title: "Appearance", href: "/guides/appearance" });
    });

    it("leaves a plain group NON-clickable (empty href)", () => {
        const bc = crumbs("guides/appearance");
        expect(bc[1]).toEqual({ title: "Customization", href: "" }); // plain group → text
    });

    it("makes a group-with-`page` clickable automatically (generic Group-Page detection)", () => {
        const bc = crumbs("guides/integrations/analytics");
        expect(bc.map((c) => c.title)).toEqual(["Guides", "Integrations", "Analytics"]);
        expect(bc[1].href).toBe("/guides/integrations"); // group has a page → real route → link
    });

    it("detects a canonical Group Page (`page` instead of `group`) — title from frontmatter, clickable", () => {
        const nav = {
            sidebar: [
                { route: "docs", pages: [{ page: "docs/integrations", pages: ["docs/integrations/analytics"] }] },
            ],
        } as unknown as Navigation;
        const fm = {
            "docs/integrations": { title: "Integrations" },
            "docs/integrations/analytics": { title: "Analytics" },
        } as any;
        const bc = resolveBreadcrumbs(nav, "docs/integrations/analytics", fm, {});
        expect(bc.map((c) => c.title)).toEqual(["Docs", "Integrations", "Analytics"]);
        expect(bc[1].href).toBe("/docs/integrations"); // Group Page → link, title from Page Meta
    });

    it("falls back to the Title-Cased route segment when no tab labels it", () => {
        const bc = crumbs("reference/core");
        expect(bc[0]).toEqual({ title: "Reference", href: "/reference" });
    });

    it("returns [] for an unknown page", () => {
        expect(crumbs("does/not/exist")).toEqual([]);
    });

    it("only crumbs with a truthy href are links (the render rule)", () => {
        // mirrors Breadcrumbs.tsx: `item.href && !lastActive`
        const bc = crumbs("guides/integrations/analytics");
        const linkable = bc.slice(0, -1).filter((c) => !!c.href).map((c) => c.title);
        expect(linkable).toEqual(["Guides", "Integrations"]); // plain groups would be excluded
    });
});

describe("displayBreadcrumbs (content.breadcrumbs options)", () => {
    const trail = crumbs("guides/appearance"); // [Guides, Customization, Appearance]

    it("defaults (true / bare boolean): keeps hrefs and the root crumb", () => {
        expect(displayBreadcrumbs(trail, true)).toEqual(trail);
        expect(displayBreadcrumbs(trail, undefined)).toEqual(trail);
        expect(displayBreadcrumbs(trail, {})).toEqual(trail);
    });

    it("links:false → strips every href (all plain text)", () => {
        const out = displayBreadcrumbs(trail, { links: false });
        expect(out.map((c) => c.href)).toEqual(["", "", ""]);
        expect(out.map((c) => c.title)).toEqual(["Guides", "Customization", "Appearance"]);
    });

    it("rootLevel:false → drops the top 'Guides' crumb (hrefs preserved)", () => {
        const out = displayBreadcrumbs(trail, { rootLevel: false });
        expect(out.map((c) => c.title)).toEqual(["Customization", "Appearance"]);
        expect(out[1].href).toBe("/guides/appearance");
    });

    it("both toggles compose", () => {
        const out = displayBreadcrumbs(trail, { links: false, rootLevel: false });
        expect(out.map((c) => c.title)).toEqual(["Customization", "Appearance"]);
        expect(out.every((c) => c.href === "")).toBe(true);
    });
});
