import { describe, expect, it } from "bun:test";
import { bumpTypeFromChanges, isAdditive } from "./bump";
import type { ReleaseChange } from "./types";

const c = (
  severity: ReleaseChange["severity"],
  kind: string,
): ReleaseChange => ({ severity, kind, path: "x", detail: "d" });

describe("bumpTypeFromChanges", () => {
  it("none for no changes", () => {
    expect(bumpTypeFromChanges([])).toBe("none");
  });

  it("major when any change is breaking", () => {
    expect(
      bumpTypeFromChanges([
        c("safe", "method-added"),
        c("breaking", "method-removed"),
      ]),
    ).toBe("major");
  });

  it("minor for additive-only", () => {
    expect(
      bumpTypeFromChanges([
        c("safe", "method-added"),
        c("risky", "enum-value-added"),
      ]),
    ).toBe("minor");
  });

  it("patch for metadata-only (deprecations, sdk-behavior)", () => {
    expect(
      bumpTypeFromChanges([
        c("risky", "deprecated-added"),
        c("safe", "sdk-behavior-changed"),
      ]),
    ).toBe("patch");
  });

  it("patch for an unknown non-breaking kind", () => {
    expect(bumpTypeFromChanges([c("risky", "param-wire-name-changed")])).toBe(
      "patch",
    );
  });
});

describe("isAdditive", () => {
  it("treats *-added as additive except deprecated-added", () => {
    expect(isAdditive("field-added")).toBe(true);
    expect(isAdditive("union-variant-added")).toBe(true);
    expect(isAdditive("deprecated-added")).toBe(false);
    expect(isAdditive("param-type-changed")).toBe(false);
  });
});
