// User appearance CSS for the bun engine — parity with the Vite path
// (`packages/xyd-host/app/root.tsx` `generateUserCss`). Turns
// `theme.appearance.colors` + `theme.appearance.cssTokens` into a `:root` (+ dark)
// custom-property block that is injected as `<style data-appearance>` in the SSR
// head. Kept as a standalone copy so the Vite path stays untouched; the two
// should be kept in sync.

import type { Appearance } from "@xyd-js/core";

function tokensToCss(
    tokens: Record<string, string | boolean | undefined>,
    wrapInRoot = true,
): string {
    const entries = Object.entries(tokens).filter(([, value]) => value !== undefined);
    if (!entries.length) return "";
    const props = entries.map(([key, value]) => `${key}: ${value};`).join("\n");
    return wrapInRoot ? `:root {\n${props}\n}` : props;
}

function generateColorTokens(primary: string): Record<string, string> {
    return {
        "--color-primary": primary,
        "--xyd-sidebar-item-bgcolor--active": "color-mix(in srgb, var(--color-primary) 10%, transparent)",
        "--xyd-sidebar-item-color--active": "var(--color-primary)",
        "--xyd-sidebar-item-bgcolor--active-hover": "var(--xyd-sidebar-item-bgcolor--active)",
        "--xyd-toc-item-color--active": "var(--color-primary)",
        "--theme-color-primary": "var(--color-primary)",
        "--theme-color-primary-active": "var(--color-primary)",
        "--color-primary--active": "color-mix(in srgb, var(--color-primary) 75%, transparent)",
        "--xyd-breadcrumbs-color": "var(--color-primary)",
    };
}

function generateDarkCss(tokens: Record<string, string>): string {
    if (!Object.keys(tokens).length) return "";
    const raw = tokensToCss(tokens, false);
    return [
        `[data-color-scheme="dark"] {\n${raw}\n}`,
        `@media (prefers-color-scheme: dark) {`,
        `    :root:not([data-color-scheme="light"]):not([data-color-scheme="dark"]) {\n        ${raw.replace(/\n/g, "\n        ")}\n    }`,
        `}`,
    ].join("\n");
}

/**
 * Map the typed `appearance.dropdown` flags to the technical `--xyd-nav-dropdown-*`
 * variables — so consumers set one informative flag instead of raw tokens.
 * (`cssTokens` still wins, since it is merged after this.)
 */
function dropdownTokens(appearance: any): Record<string, string> {
    const d = appearance?.navigationDropdown;
    if (!d) return {};
    const t: Record<string, string> = {};
    if (d.items === "flush") {
        // Hovered item background touches all four edges of the popover. Bump the
        // per-item padding so full-bleed rows don't look cramped against the edges.
        t["--xyd-nav-dropdown-padding"] = "0";
        t["--xyd-nav-dropdown-gap"] = "0";
        t["--xyd-nav-dropdown-item-radius"] = "0";
        t["--xyd-nav-dropdown-item-padding"] = "10px 16px";
    }
    if (d.chevron === "static") {
        t["--xyd-nav-dropdown-chevron-rotate"] = "0deg";
    }
    return t;
}

/** `theme.appearance` → CSS (colors + dropdown flags + cssTokens, light + dark), or `""`. */
export function generateUserCss(appearance?: Appearance): string {
    if (!appearance) return "";
    const { colors, cssTokens } = appearance as any;
    const dropdown = dropdownTokens(appearance);

    const lightTokens = {
        ...(colors?.primary ? generateColorTokens(colors.primary) : {}),
        ...dropdown,
        ...(cssTokens || {}),
    };
    const darkTokens = {
        ...(colors?.light ? generateColorTokens(colors.light) : {}),
        ...dropdown,
        ...(cssTokens || {}),
    };

    const lightCss = tokensToCss(lightTokens);
    const darkCss = generateDarkCss(darkTokens);
    return [lightCss, darkCss].filter(Boolean).join("\n\n");
}

/** `<style data-appearance>` for the SSR head, or `""` when there is nothing to add. */
export function userAppearanceStyle(settings: any): string {
    const css = generateUserCss(settings?.theme?.appearance);
    return css ? `<style data-appearance>${css}</style>` : "";
}
