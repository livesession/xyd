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

    it("name a primary set through cssTokens, in light and in both dark modes", () => {
        const css = generateUserCss({ cssTokens: { "--color-primary": "#c2410c" } } as any);
        for (const selector of [
            ":root",
            '[data-color-scheme="dark"]',
            ':root:not([data-color-scheme="light"]):not([data-color-scheme="dark"])',
        ]) {
            expect(block(css, selector), selector).toContain("--color-primary: #c2410c;");
            expect(block(css, selector), selector).toContain("--xyd-appearance-color-primary: #c2410c;");
        }
    });

    it("let the cssTokens primary win over colors.primary, as cssTokens does for --color-primary", () => {
        const css = generateUserCss({
            colors: { primary: "#d00000" },
            cssTokens: { "--color-primary": "#c2410c" },
        } as any);
        const root = block(css, ":root");
        expect(root).toContain("--color-primary: #c2410c;");
        expect(root).toContain("--xyd-appearance-color-primary: #c2410c;");
        expect(root).not.toContain("--xyd-appearance-color-primary: #d00000;");
    });

    it("keep an appearance primary of the site's own, and never refer it to itself", () => {
        const own = generateUserCss({
            cssTokens: { "--color-primary": "#c2410c", "--xyd-appearance-color-primary": "#123456" },
        } as any);
        expect(block(own, ":root")).toContain("--xyd-appearance-color-primary: #123456;");
        expect(block(own, ":root")).not.toContain("--xyd-appearance-color-primary: #c2410c;");

        const cycle = generateUserCss({
            cssTokens: { "--color-primary": "var(--xyd-appearance-color-primary, #c2410c)" },
        } as any);
        expect(block(cycle, ":root")).not.toContain("--xyd-appearance-color-primary: var(");
    });

    it("leave it unset when the site sets no colour", () => {
        expect(generateUserCss({ cssTokens: { "--xyd-page-gutter": "0" } } as any)).not.toContain(
            "--xyd-appearance-color-primary"
        );
        expect(generateUserCss(undefined)).toBe("");
    });
});
