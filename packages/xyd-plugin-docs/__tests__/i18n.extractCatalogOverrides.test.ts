import { describe, it, expect } from "vitest";

import type { TranslationCatalog } from "@xyd-js/core";

import { extractCatalogOverrides } from "../src";

/**
 * Catalog keys prefixed with `$` are settings override paths, not
 * translation keys. extractCatalogOverrides:
 *   1. pulls those keys out of every catalog (mutating to drop the `$` keys)
 *   2. returns a per-locale flat-key overrides map (without the `$` prefix)
 *
 * The returned map is later merged into navigation.languages[].overrides
 * so applyOverrides (in mapSettingsToProps) picks it up at request time.
 */
describe("extractCatalogOverrides", () => {
    it("splits $-prefixed keys into a per-locale overrides map", () => {
        const catalogs: Record<string, TranslationCatalog> = {
            en: {
                "sidebar.greet": "Hello"
            },
            pl: {
                "sidebar.greet": "Cześć",
                "$components.footer.props.children": "Wspierane przez LiveSession"
            }
        };

        const out = extractCatalogOverrides(catalogs);

        expect(out).toEqual({
            pl: {
                "components.footer.props.children": "Wspierane przez LiveSession"
            }
        });
        // `$` keys removed from the catalog itself
        expect(catalogs.pl).toEqual({ "sidebar.greet": "Cześć" });
        // English catalog untouched (no `$` keys)
        expect(catalogs.en).toEqual({ "sidebar.greet": "Hello" });
    });

    it("returns multiple override paths per locale", () => {
        const catalogs: Record<string, TranslationCatalog> = {
            pl: {
                "$components.footer.props.children": "Wspierane",
                "$components.footer.props.href": "https://pl.livesession.io",
                "sidebar.welcome": "Witaj"
            }
        };

        const out = extractCatalogOverrides(catalogs);

        expect(out.pl).toEqual({
            "components.footer.props.children": "Wspierane",
            "components.footer.props.href": "https://pl.livesession.io"
        });
        expect(catalogs.pl).toEqual({ "sidebar.welcome": "Witaj" });
    });

    it("omits a locale from the result when its catalog has no $-keys", () => {
        const catalogs: Record<string, TranslationCatalog> = {
            en: { "sidebar.greet": "Hello" },
            pl: { "sidebar.greet": "Cześć" }
        };

        const out = extractCatalogOverrides(catalogs);

        expect(out).toEqual({});
        // catalogs unchanged
        expect(catalogs.en).toEqual({ "sidebar.greet": "Hello" });
        expect(catalogs.pl).toEqual({ "sidebar.greet": "Cześć" });
    });

    it("handles empty / non-object catalogs gracefully", () => {
        const catalogs = {
            en: undefined as any,
            pl: null as any,
            de: { "$components.x.y": 1 }
        };

        const out = extractCatalogOverrides(catalogs);

        expect(out).toEqual({ de: { "components.x.y": 1 } });
        expect(catalogs.de).toEqual({});
    });

    it("preserves the value type of overridden entries (string, object, array)", () => {
        const arr = [1, 2, 3];
        const obj = { a: 1, b: 2 };
        const catalogs: Record<string, TranslationCatalog> = {
            pl: {
                "$components.list.props.items": arr as any,
                "$components.foo.props.config": obj as any,
                "$components.bar.props.label": "Etykieta"
            }
        };

        const out = extractCatalogOverrides(catalogs);

        expect(out.pl["components.list.props.items"]).toBe(arr);
        expect(out.pl["components.foo.props.config"]).toBe(obj);
        expect(out.pl["components.bar.props.label"]).toBe("Etykieta");
    });
});
