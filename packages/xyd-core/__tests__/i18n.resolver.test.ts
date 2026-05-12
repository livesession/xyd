import { describe, it, expect } from "vitest";

import { resolveI18nString, resolveI18nDeep } from "../src/i18n/resolver";

const catalogs = {
    en: {
        "footer.resources.header": "Resources",
        "footer.resources.examples": "Examples",
    },
    pl: {
        // Nested form, mixed with flat keys.
        footer: {
            resources: {
                header: "Zasoby",
            },
        },
        "footer.resources.examples": "Przykłady",
    },
};

describe("resolveI18nString", () => {
    it("returns plain strings unchanged", () => {
        expect(resolveI18nString("Hello", "en", "en", catalogs as any)).toBe("Hello");
    });

    it("looks up flat dot-keys in current locale", () => {
        expect(
            resolveI18nString("i18n: footer.resources.header", "en", "en", catalogs as any)
        ).toBe("Resources");
    });

    it("looks up nested dot-paths in current locale", () => {
        expect(
            resolveI18nString("i18n: footer.resources.header", "pl", "en", catalogs as any)
        ).toBe("Zasoby");
    });

    it("treats prefix without trailing space as valid (i18n:key)", () => {
        expect(
            resolveI18nString("i18n:footer.resources.header", "en", "en", catalogs as any)
        ).toBe("Resources");
    });

    it("falls back to default locale when current locale lacks the key", () => {
        expect(
            resolveI18nString("i18n: footer.resources.header", "de", "en", catalogs as any)
        ).toBe("Resources");
    });

    it("falls back to literal key when neither locale has the key", () => {
        expect(
            resolveI18nString("i18n: missing.key", "de", "en", catalogs as any)
        ).toBe("missing.key");
    });

    it("returns value as-is when catalogs are undefined", () => {
        expect(
            resolveI18nString("i18n: footer.resources.header", "en", "en", undefined)
        ).toBe("i18n: footer.resources.header");
    });
});

describe("resolveI18nDeep", () => {
    it("walks nested objects and arrays, replacing leaf strings", () => {
        const input = {
            sidebar: [
                { group: "i18n: footer.resources.header", pages: ["intro"] },
                { group: "Static", pages: ["i18n: footer.resources.examples"] },
            ],
            footer: {
                heading: "i18n: footer.resources.header",
                year: 2024,
            },
        };

        const out = resolveI18nDeep(input, "pl", "en", catalogs as any);

        expect(out).toEqual({
            sidebar: [
                { group: "Zasoby", pages: ["intro"] },
                { group: "Static", pages: ["Przykłady"] },
            ],
            footer: {
                heading: "Zasoby",
                year: 2024,
            },
        });
    });

    it("is a no-op when catalogs are undefined", () => {
        const input = { x: "i18n: a.b", y: 42 };
        const out = resolveI18nDeep(input, "en", "en", undefined);
        expect(out).toEqual({ x: "i18n: a.b", y: 42 });
    });
});
