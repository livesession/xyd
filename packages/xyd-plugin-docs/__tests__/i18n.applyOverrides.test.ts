import { describe, it, expect } from "vitest";

import type { Settings } from "@xyd-js/core";

import {
    applyOverrides,
    expandDotKeys,
    resolveLocaleSettings
} from "../../xyd-framework/packages/hydration/mapSettingsToProps";

/**
 * applyOverrides + expandDotKeys + resolveLocaleSettings power per-locale
 * settings overrides. Tests cover:
 *   - Nested object overrides (Partial<Settings> form)
 *   - Flat dot-key overrides ({"a.b.c": v})
 *   - Mixed form in the same overrides block
 *   - Edge cases: empty overrides, primitive replacement, array replacement
 *   - resolveLocaleSettings end-to-end (lang.overrides applied + navigation swap)
 */
describe("applyOverrides", () => {
    it("returns base unchanged when overrides is empty/null/undefined", () => {
        const base = { components: { footer: { children: "x" } } };

        expect(applyOverrides(base, undefined)).toBe(base);
        expect(applyOverrides(base, null)).toBe(base);
        expect(applyOverrides(base, "not an object")).toBe(base);
    });

    it("merges nested object overrides without mutating base", () => {
        const base = {
            components: {
                footer: {
                    footnote: {
                        component: "a",
                        props: { href: "https://x.io", children: "Powered" }
                    }
                }
            }
        };
        const overrides = {
            components: {
                footer: {
                    footnote: {
                        props: { children: "Wspierane" }
                    }
                }
            }
        };

        const out = applyOverrides(base, overrides) as typeof base;

        // Override only touched `children`; everything else is preserved.
        expect(out.components.footer.footnote.component).toBe("a");
        expect(out.components.footer.footnote.props.href).toBe("https://x.io");
        expect(out.components.footer.footnote.props.children).toBe("Wspierane");
        // Base untouched.
        expect(base.components.footer.footnote.props.children).toBe("Powered");
    });

    it("expands flat dot-keys into nested form before merging", () => {
        const base = {
            components: {
                footer: {
                    footnote: {
                        props: { href: "https://x.io", children: "Powered" }
                    }
                }
            }
        };
        const overrides = {
            "components.footer.footnote.props.children": "Wspierane"
        };

        const out = applyOverrides(base, overrides) as typeof base;

        expect(out.components.footer.footnote.props.children).toBe("Wspierane");
        expect(out.components.footer.footnote.props.href).toBe("https://x.io");
    });

    it("handles multiple dot-keys with shared prefix", () => {
        const base = {
            components: {
                footer: { footnote: { props: { href: "https://x.io", children: "Powered" } } }
            }
        };
        const overrides = {
            "components.footer.footnote.props.children": "Wspierane",
            "components.footer.footnote.props.href": "https://pl.x.io"
        };

        const out = applyOverrides(base, overrides) as typeof base;

        expect(out.components.footer.footnote.props.children).toBe("Wspierane");
        expect(out.components.footer.footnote.props.href).toBe("https://pl.x.io");
    });

    it("accepts a mix of nested objects and dot-keys in the same overrides block", () => {
        const base = {
            components: {
                footer: { footnote: { props: { href: "https://x.io", children: "Powered" } } },
                header: { logo: { src: "/logo.svg" } }
            }
        };
        const overrides = {
            "components.footer.footnote.props.children": "Wspierane",
            components: {
                header: { logo: { src: "/pl-logo.svg" } }
            }
        };

        const out = applyOverrides(base, overrides) as typeof base;

        expect(out.components.footer.footnote.props.children).toBe("Wspierane");
        expect(out.components.footer.footnote.props.href).toBe("https://x.io");
        expect(out.components.header.logo.src).toBe("/pl-logo.svg");
    });

    it("replaces arrays wholesale (does not deep-merge array elements)", () => {
        const base = {
            navigation: {
                anchors: { header: [{ name: "EN", href: "/en" }, { name: "EN2", href: "/en2" }] }
            }
        };
        const overrides = {
            "navigation.anchors.header": [{ name: "PL", href: "/pl" }]
        };

        const out = applyOverrides(base, overrides) as typeof base;

        expect(out.navigation.anchors.header).toEqual([{ name: "PL", href: "/pl" }]);
    });

    it("replaces primitives with new primitive value", () => {
        const base = { theme: { name: "cosmo" } };
        const overrides = { "theme.name": "poetry" };

        const out = applyOverrides(base, overrides) as typeof base;

        expect(out.theme.name).toBe("poetry");
    });

    it("creates missing intermediate path segments via dot-key", () => {
        const base = { components: {} } as any;
        const overrides = { "components.footer.props.children": "hi" };

        const out = applyOverrides(base, overrides);

        expect(out.components.footer.props.children).toBe("hi");
    });
});

describe("expandDotKeys", () => {
    it("turns flat dot-key entries into nested form", () => {
        expect(expandDotKeys({ "a.b.c": 1 })).toEqual({ a: { b: { c: 1 } } });
    });

    it("merges sibling dot-keys under shared prefix", () => {
        expect(expandDotKeys({ "a.b.c": 1, "a.b.d": 2 })).toEqual({
            a: { b: { c: 1, d: 2 } }
        });
    });

    it("preserves existing nested entries (no dot in key)", () => {
        expect(expandDotKeys({ a: { x: 1 }, "a.b": 2 })).toEqual({
            a: { x: 1, b: 2 }
        });
    });

    it("returns arrays and primitives as-is", () => {
        const arr = [1, 2, 3];
        expect(expandDotKeys(arr)).toBe(arr);
        expect(expandDotKeys(42)).toBe(42);
        expect(expandDotKeys(null)).toBe(null);
    });
});

describe("resolveLocaleSettings", () => {
    function makeSettings(): Settings {
        return {
            theme: { name: "cosmo" },
            components: {
                footer: {
                    footnote: {
                        component: "a",
                        props: { href: "https://x.io", children: "Powered" }
                    }
                }
            } as any,
            navigation: {
                sidebar: [{ group: "shared", pages: ["intro"] }] as any,
                languages: [
                    { language: "en", default: true } as any,
                    {
                        language: "pl",
                        sidebar: [{ group: "pl-sidebar", pages: ["pl/intro"] }],
                        overrides: {
                            "components.footer.footnote.props.children": "Wspierane"
                        }
                    } as any
                ]
            } as any
        } as Settings;
    }

    it("returns settings unchanged when no locale is provided", () => {
        const s = makeSettings();
        expect(resolveLocaleSettings(s, undefined)).toBe(s);
    });

    it("returns settings unchanged when locale doesn't match any language entry", () => {
        const s = makeSettings();
        expect(resolveLocaleSettings(s, "ja")).toBe(s);
    });

    it("swaps in the matching language entry's navigation fields", () => {
        const s = makeSettings();
        const resolved = resolveLocaleSettings(s, "pl");
        expect(resolved.navigation!.sidebar).toEqual([
            { group: "pl-sidebar", pages: ["pl/intro"] }
        ]);
    });

    it("applies the matching language entry's overrides (dot-key form)", () => {
        const s = makeSettings();
        const resolved = resolveLocaleSettings(s, "pl") as any;
        expect(resolved.components.footer.footnote.props.children).toBe("Wspierane");
        expect(resolved.components.footer.footnote.props.href).toBe("https://x.io");
    });

    it("leaves the base settings object untouched after resolution", () => {
        const s = makeSettings();
        resolveLocaleSettings(s, "pl");
        expect((s as any).components.footer.footnote.props.children).toBe("Powered");
    });
});
