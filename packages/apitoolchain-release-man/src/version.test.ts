import { describe, expect, it } from "bun:test";
import { nextVersion, parseSemver, parseVersionOverride } from "./version";

describe("nextVersion", () => {
  it("first release → 0.1.0", () => {
    expect(nextVersion("", "minor")).toBe("0.1.0");
    expect(nextVersion("0.0.0", "major")).toBe("0.1.0");
  });

  it("stable (>=1.0.0) standard bumps", () => {
    expect(nextVersion("1.3.2", "major")).toBe("2.0.0");
    expect(nextVersion("1.3.2", "minor")).toBe("1.4.0");
    expect(nextVersion("1.3.2", "patch")).toBe("1.3.3");
    expect(nextVersion("1.3.2", "none")).toBe("1.3.2");
  });

  it("pre-1.0 softens one level (no auto-jump to 1.0)", () => {
    expect(nextVersion("0.4.1", "major")).toBe("0.5.0"); // major→minor
    expect(nextVersion("0.4.1", "minor")).toBe("0.4.2"); // minor→patch
    expect(nextVersion("0.4.1", "patch")).toBe("0.4.2");
  });

  it("tolerates a v-prefix", () => {
    expect(nextVersion("v2.0.0", "minor")).toBe("2.1.0");
  });
});

describe("parseSemver", () => {
  it("parses and rejects", () => {
    expect(parseSemver("1.2.3")).toEqual({
      major: 1,
      minor: 2,
      patch: 3,
      pre: "",
    });
    expect(parseSemver("nope")).toBeNull();
  });
});

describe("parseVersionOverride", () => {
  it("extracts a version from a PR title", () => {
    expect(parseVersionOverride("release: livesession-api-go v2.0.0")).toBe(
      "2.0.0",
    );
    expect(parseVersionOverride("2.1.0-beta.1")).toBe("2.1.0-beta.1");
    expect(parseVersionOverride("no version here")).toBeNull();
  });
});
