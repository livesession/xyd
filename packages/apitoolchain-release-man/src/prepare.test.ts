import { describe, expect, it } from "bun:test";
import { prepareRelease } from "./prepare";
import type { ReleaseChange } from "./types";

const CHANGES: ReleaseChange[] = [
  {
    severity: "breaking",
    kind: "method-removed",
    path: "pets.delete",
    detail: "removed pets.delete",
  },
  {
    severity: "safe",
    kind: "method-added",
    path: "pets.list",
    detail: "added pets.list",
  },
  {
    severity: "risky",
    kind: "deprecated-added",
    path: "pets.get",
    detail: "deprecated pets.get",
  },
];

const base = {
  fromVersion: "1.2.0",
  changes: CHANGES,
  apiName: "Pets API",
  language: "go",
  headSpecVersion: "2.0.0",
  baseSpecVersion: "1.0.0",
  date: "2026-07-06",
};

describe("prepareRelease", () => {
  it("computes a major bump + version from a breaking change", () => {
    const r = prepareRelease(base);
    expect(r.bump).toBe("major");
    expect(r.toVersion).toBe("2.0.0");
    expect(r.breakingCount).toBe(1);
  });

  it("honors a version override (edited PR title)", () => {
    const r = prepareRelease({
      ...base,
      versionOverride: "release: Pets API v9.9.9",
    });
    expect(r.toVersion).toBe("9.9.9");
    expect(r.prBody).toContain("manual override");
  });

  it("renders a changelog with grouped sections", () => {
    const r = prepareRelease(base);
    expect(r.changelogEntry).toContain("## 2.0.0 (2026-07-06)");
    expect(r.changelogEntry).toContain("### ⚠ BREAKING CHANGES");
    expect(r.changelogEntry).toContain("### Features");
    expect(r.changelogEntry).toContain("removed pets.delete (`pets.delete`)");
  });

  it("renders a PR body with the breaking-change table", () => {
    const r = prepareRelease(base);
    expect(r.prBody).toContain("**Bump:** `major`");
    expect(r.prBody).toContain("| ⚠ Breaking | 1 |");
    expect(r.prBody).toContain("v1.2.0 → **v2.0.0**");
  });

  it("is deterministic (same inputs → byte-identical output)", () => {
    expect(prepareRelease(base)).toEqual(prepareRelease(base));
  });

  it("empty diff → no bump, empty changelog", () => {
    const r = prepareRelease({ ...base, changes: [] });
    expect(r.bump).toBe("none");
    expect(r.toVersion).toBe("1.2.0");
    expect(r.changelogEntry).toContain("_No API changes._");
  });
});
