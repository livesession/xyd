import { describe, it, expect } from "vitest";

import { asTocEnabled, asTocOptions } from "../src/asToc";

/**
 * `asToc` accepts `true` or an options object (both enable), everything else
 * disables. The Rust pagemap gate (crates/xyd_settings/src/pagemap.rs
 * `is_as_toc`) mirrors asTocEnabled — these cases document the shared contract.
 */
describe("asTocEnabled / asTocOptions", () => {
    it("boolean forms", () => {
        expect(asTocEnabled(true)).toBe(true);
        expect(asTocEnabled(false)).toBe(false);
        expect(asTocEnabled(undefined)).toBe(false);
    });

    it("object forms enable (junk does not)", () => {
        expect(asTocEnabled({})).toBe(true);
        expect(asTocEnabled({ indicator: false })).toBe(true);
        expect(asTocEnabled(null as any)).toBe(false);
        expect(asTocEnabled("true" as any)).toBe(false);
        expect(asTocEnabled(1 as any)).toBe(false);
    });

    it("resolves defaults: every behavior enabled", () => {
        expect(asTocOptions(true)).toEqual({ indicator: true, breadcrumbs: true });
        expect(asTocOptions({})).toEqual({ indicator: true, breadcrumbs: true });
    });

    it("object form disables selectively", () => {
        expect(asTocOptions({ indicator: false })).toEqual({ indicator: false, breadcrumbs: true });
        expect(asTocOptions({ breadcrumbs: false })).toEqual({ indicator: true, breadcrumbs: false });
        expect(asTocOptions({ indicator: false, breadcrumbs: false }))
            .toEqual({ indicator: false, breadcrumbs: false });
    });

    it("disabled values resolve to null", () => {
        expect(asTocOptions(false)).toBeNull();
        expect(asTocOptions(undefined)).toBeNull();
    });
});
