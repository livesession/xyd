import { describe, expect, it } from "vitest";

import { orderSdkLanguages } from "../src/presets/uniform/sdkEnrich";

// Spec mode (`x-sdk`): which languages a source renders, in switcher order.
// The raw-HTTP entry is outside both lists — the switcher always shows it first.
describe("orderSdkLanguages", () => {
    const spec = ["go", "python", "typescript"];

    it("keeps the spec's own order when no list is configured (`sdk: true` / no config)", () => {
        expect(orderSdkLanguages(spec)).toEqual(["go", "python", "typescript"]);
        expect(orderSdkLanguages(spec, undefined)).toEqual(["go", "python", "typescript"]);
        expect(orderSdkLanguages(spec, null)).toEqual(["go", "python", "typescript"]);
    });

    it("a configured list narrows the spec's languages AND sets the order", () => {
        expect(orderSdkLanguages(spec, ["typescript", "go"])).toEqual(["typescript", "go"]);
        expect(orderSdkLanguages(spec, ["python"])).toEqual(["python"]);
    });

    it("drops ids the spec does not carry, collapses repeats to the first position", () => {
        expect(orderSdkLanguages(spec, ["ruby", "typescript", "cobol", "python", "typescript"])).toEqual(["typescript", "python"]);
    });

    it("is null when nothing is left — the page renders the plain REST view", () => {
        expect(orderSdkLanguages(spec, ["ruby", "java"])).toBeNull();
        expect(orderSdkLanguages([], ["go"])).toBeNull();
        expect(orderSdkLanguages([])).toBeNull();
    });

    it("never mutates its inputs", () => {
        const configured = ["python", "go"];
        const out = orderSdkLanguages(spec, configured);
        expect(out).toEqual(["python", "go"]);
        expect(out).not.toBe(configured);
        expect(spec).toEqual(["go", "python", "typescript"]);
    });
});
