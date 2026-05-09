import { describe, it, expect } from "vitest";

import type { Settings } from "@xyd-js/core";

import { inheritTopLevelNavigation } from "../src";

/**
 * Catalog-only mode: when navigation.languages[].sidebar (or tabs/etc.) is
 * undefined, inheritTopLevelNavigation copies the top-level navigation field
 * down onto each language entry. Lets users write the structure once and only
 * declare locales — translations come from i18n catalogs.
 */
describe("inheritTopLevelNavigation", () => {
    it("copies top-level sidebar onto language entries that omit it", () => {
        const settings = {
            navigation: {
                sidebar: [
                    { group: "i18n: sidebar.getstarted", pages: ["intro"] }
                ],
                languages: [
                    { language: "en", default: true },
                    { language: "pl" }
                ]
            }
        } as unknown as Settings;

        inheritTopLevelNavigation(settings);

        for (const lang of settings.navigation!.languages!) {
            expect(lang.sidebar).toEqual([
                { group: "i18n: sidebar.getstarted", pages: ["intro"] }
            ]);
        }
    });

    it("does not overwrite a language entry that defines its own sidebar", () => {
        const settings = {
            navigation: {
                sidebar: [{ group: "Get Started", pages: ["intro"] }],
                languages: [
                    { language: "en", default: true },
                    {
                        language: "pl",
                        sidebar: [{ group: "Wprowadzenie", pages: ["intro"] }]
                    }
                ]
            }
        } as unknown as Settings;

        inheritTopLevelNavigation(settings);

        const en = settings.navigation!.languages![0];
        const pl = settings.navigation!.languages![1];

        expect(en.sidebar).toEqual([{ group: "Get Started", pages: ["intro"] }]);
        expect(pl.sidebar).toEqual([
            { group: "Wprowadzenie", pages: ["intro"] }
        ]);
    });

    it("inherits each navigation field independently", () => {
        const settings = {
            navigation: {
                sidebar: [{ group: "shared", pages: ["intro"] }],
                tabs: [{ tab: "i18n: tab.guides", page: "intro" }],
                anchors: { header: [{ name: "GitHub", href: "https://x" }] },
                languages: [
                    { language: "en", default: true },
                    {
                        language: "pl",
                        // pl overrides only sidebar; tabs and anchors should
                        // still be inherited from the top level.
                        sidebar: [{ group: "polski", pages: ["intro"] }]
                    }
                ]
            }
        } as unknown as Settings;

        inheritTopLevelNavigation(settings);

        const pl = settings.navigation!.languages![1];

        expect(pl.sidebar).toEqual([{ group: "polski", pages: ["intro"] }]);
        expect(pl.tabs).toEqual([{ tab: "i18n: tab.guides", page: "intro" }]);
        expect(pl.anchors).toEqual({
            header: [{ name: "GitHub", href: "https://x" }]
        });
    });

    it("deep-clones inherited fields so per-locale mutation does not leak", () => {
        const sharedSidebar = [
            { group: "shared", pages: ["intro"] }
        ];
        const settings = {
            navigation: {
                sidebar: sharedSidebar,
                languages: [
                    { language: "en", default: true },
                    { language: "pl" }
                ]
            }
        } as unknown as Settings;

        inheritTopLevelNavigation(settings);

        const pl = settings.navigation!.languages![1];

        // Mutate pl's copy — the top-level source must not change.
        (pl.sidebar as any)[0].pages[0] = "pl/intro";

        expect(sharedSidebar[0].pages).toEqual(["intro"]);
    });

    it("is a no-op when navigation.languages is undefined or empty", () => {
        const noLanguages = {
            navigation: {
                sidebar: [{ group: "Get Started", pages: ["intro"] }]
            }
        } as unknown as Settings;

        const before = JSON.stringify(noLanguages);
        inheritTopLevelNavigation(noLanguages);
        expect(JSON.stringify(noLanguages)).toBe(before);

        const empty = {
            navigation: {
                sidebar: [{ group: "Get Started", pages: ["intro"] }],
                languages: []
            }
        } as unknown as Settings;

        const before2 = JSON.stringify(empty);
        inheritTopLevelNavigation(empty);
        expect(JSON.stringify(empty)).toBe(before2);
    });
});
