import { describe, expect, it } from "bun:test";
import { DEFAULT_RELEASE_CONFIG, parseReleaseConfig } from "./config";
import { buildReleaseLock, renderReleaseManifest } from "./lock";

describe("buildReleaseLock", () => {
  it("hashes files with sorted, timestamp-free keys", () => {
    const lock = buildReleaseLock(
      { "b.ts": "beta", "a.ts": "alpha" },
      { generator: "apitoolchain", version: "1.0.0" },
    );
    expect(Object.keys(lock.files)).toEqual(["a.ts", "b.ts"]); // sorted
    expect(lock.files["a.ts"]).toMatch(/^[0-9a-f]{64}$/);
    expect(lock.schemaVersion).toBe(1);
  });

  it("is deterministic (no-op re-run is byte-identical)", () => {
    const files = { "x.ts": "hello", "y.ts": "world" };
    const meta = { generator: "g", version: "1.0.0" };
    expect(buildReleaseLock(files, meta)).toEqual(
      buildReleaseLock(files, meta),
    );
  });

  it("content change flips the hash", () => {
    const a = buildReleaseLock(
      { "x.ts": "one" },
      { generator: "g", version: "1" },
    );
    const b = buildReleaseLock(
      { "x.ts": "two" },
      { generator: "g", version: "1" },
    );
    expect(a.files["x.ts"]).not.toBe(b.files["x.ts"]);
  });
});

describe("renderReleaseManifest", () => {
  it("combines config + lock into valid JSON", () => {
    const out = renderReleaseManifest({
      config: {
        autoRelease: true,
        baseBranch: "main",
        prerelease: false,
        versioning: "auto",
      },
      files: { "a.ts": "x" },
      generator: "apitoolchain@0.0.0",
      version: "1.2.0",
    });
    const parsed = JSON.parse(out);
    expect(parsed.config.autoRelease).toBe(true);
    expect(parsed.lock.version).toBe("1.2.0");
    expect(out.endsWith("\n")).toBe(true);
  });
});

describe("parseReleaseConfig", () => {
  it("fills defaults + coerces types", () => {
    expect(parseReleaseConfig(null)).toEqual(DEFAULT_RELEASE_CONFIG);
    expect(
      parseReleaseConfig({ autoRelease: true, versioning: "manual" }),
    ).toEqual({
      autoRelease: true,
      baseBranch: "",
      prerelease: false,
      versioning: "manual",
    });
  });
});
