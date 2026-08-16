// H6 both-mode gate for the Rust highlighter. The `tests-native.yml` loop runs
// this file twice — once with the `@xyd-js/native` addon present (native path)
// and once with `XYD_NATIVE=0` (codehike fallback). Both must produce the SAME
// codehike-shaped `HighlightedCode`, proving the shim dispatches correctly and
// the Rust engine matches codehike at the call-site boundary. (Full byte-exact
// parity across 54 cells lives in `crates/xyd_highlight`'s cargo tests; this
// asserts the JS shim wiring + both paths agree on representative output.)
import { describe, expect, it } from "vitest";

import { highlight } from "../src/highlight";

describe("highlight shim (native ⇄ codehike, both modes)", () => {
    it("js → codehike HighlightedCode shape + known tokens", async () => {
        const hc = await highlight({ value: "const x = 1;", lang: "js", meta: "" }, "github-dark");

        // lighter resolves the alias → grammar id.
        expect(hc.lang).toBe("javascript");
        // No `!`-annotations in this corpus → always [].
        expect(hc.annotations).toEqual([]);
        // `code === value` (no annotation stripping).
        expect(hc.code).toBe("const x = 1;");
        // Block style from the theme's global fg/bg.
        expect(hc.style.colorScheme).toBe("dark");
        // First token: the `const` keyword in github-dark.
        expect(hc.tokens[0]).toEqual(["const", "#FF7B72"]);
    });

    it("a second language resolves + highlights", async () => {
        const hc = await highlight({ value: "def f():\n    return 1", lang: "python", meta: "" }, "github-dark");
        expect(hc.lang).toBe("python");
        expect(hc.annotations).toEqual([]);
        // `def` is a python keyword — must be colored (not the default text color).
        const first = hc.tokens.find((t) => Array.isArray(t) && t[0] === "def");
        expect(first).toBeDefined();
        expect((first as [string, string])[1]).toBe("#FF7B72");
    });

    it("dark-plus theme yields its own palette", async () => {
        const hc = await highlight({ value: "const x = 1;", lang: "js", meta: "" }, "dark-plus");
        expect(hc.themeName).toBe("dark-plus");
        // dark-plus colors `const` differently from github-dark.
        expect(hc.tokens[0]).toEqual(["const", "#569CD6"]);
    });
});
