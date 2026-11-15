import { describe, expect, it } from "vitest";

import { generateUserCss } from "../src/bun/userCss";

// The themes that give their links (and the reference's accent) a shade of
// their own primary for contrast read --xyd-appearance-color-primary first, so
// a site's `theme.appearance.colors` still reaches its links.

function block(css: string, selector: string): string {
    const start = css.indexOf(selector + " {");
    expect(start, selector).toBeGreaterThanOrEqual(0);
    return css.slice(start, css.indexOf("}", start));
}

describe("the appearance colours", () => {
    it("name the site's primary for the themes' link shades", () => {
        const css = generateUserCss({ colors: { primary: "#d00000" } } as any);
        expect(block(css, ":root")).toContain("--xyd-appearance-color-primary: #d00000;");
        expect(block(css, ":root")).toContain("--color-primary: #d00000;");
        // No dark colour: the light one applies in dark mode too.
        expect(css).not.toContain('[data-color-scheme="dark"]');
    });

    it("name the dark colour under both dark-mode selectors", () => {
        const css = generateUserCss({ colors: { primary: "#d00000", light: "#ff8080" } } as any);
        expect(block(css, '[data-color-scheme="dark"]')).toContain("--xyd-appearance-color-primary: #ff8080;");
        expect(block(css, ':root:not([data-color-scheme="light"]):not([data-color-scheme="dark"])')).toContain(
            "--xyd-appearance-color-primary: #ff8080;"
        );
    });

    it("leave it unset when the site sets no colour", () => {
        expect(generateUserCss({ cssTokens: { "--xyd-page-gutter": "0" } } as any)).not.toContain(
            "--xyd-appearance-color-primary"
        );
        expect(generateUserCss(undefined)).toBe("");
    });
});
