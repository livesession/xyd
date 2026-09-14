/**
 * Pins the `opensdk publish` invocation that replaced the TypeScript `publishTarget()`.
 *
 * Publishing itself is side-effecting and cannot be oracled — but the argv/env wiring
 * is the part that would silently be wrong, so that is what is asserted here. No
 * subprocess is spawned.
 *
 *   bun test genframework/__oracle__/publish.test.ts
 */
import { expect, test } from "bun:test";

import { buildPublishInvocation } from "../publish";

test("maps every option to its flag", () => {
  const { args } = buildPublishInvocation({
    language: "node",
    dir: "/tmp/sdk",
    registry: "https://registry.npmjs.org",
    version: "1.2.3",
    tag: "next",
  });
  expect(args).toEqual([
    "publish",
    "--lang",
    "node",
    "--output",
    "/tmp/sdk",
    "--registry",
    "https://registry.npmjs.org",
    "--package-version",
    "1.2.3",
    "--tag",
    "next",
  ]);
});

test("omits absent options rather than passing empty flags", () => {
  const { args } = buildPublishInvocation({ language: "go", dir: "/tmp/sdk" });
  expect(args).toEqual(["publish", "--lang", "go", "--output", "/tmp/sdk"]);
  expect(args).not.toContain("--registry");
  expect(args).not.toContain("--package-version");
  expect(args).not.toContain("--tag");
});

test("SECURITY: the token goes in env, never in argv", () => {
  const token = "super-secret-token";
  const { args, env } = buildPublishInvocation({
    language: "python",
    dir: "/tmp/sdk",
    registry: "https://pypi.org",
    token,
  });
  // argv is world-readable via `ps` — a token passed as a flag leaks to every user
  // on the host. This is the assertion that matters most in this file.
  expect(args.join(" ")).not.toContain(token);
  expect(args).not.toContain("--token");
  expect(env.OPENSDK_PUBLISH_TOKEN).toBe(token);
});

test("no token means no env var (anonymous / local feed)", () => {
  const { env } = buildPublishInvocation({ language: "ruby", dir: "/tmp/sdk" });
  expect(env.OPENSDK_PUBLISH_TOKEN).toBeUndefined();
  expect(Object.keys(env)).toHaveLength(0);
});

test("dry-run is a flag, not a value", () => {
  const { args } = buildPublishInvocation({
    language: "java",
    dir: "/tmp/sdk",
    dryRun: true,
  });
  expect(args).toContain("--dry-run");
  expect(args[args.indexOf("--dry-run") + 1]).toBeUndefined();
});

/** The CLI must actually accept what we build — otherwise this file pins a command
 * the binary rejects. Uses --help parsing rather than running a publish. */
test("the flags this builds exist on the real CLI", async () => {
  const { existsSync } = await import("node:fs");
  const bin =
    process.env.XYD_OPENSDK_BIN ??
    `${process.cwd()}/../../crates/target/release/opensdk`;
  if (!existsSync(bin)) return; // binary not built here — covered in CI
  const { spawnSync } = await import("node:child_process");
  const help =
    spawnSync(bin, ["publish", "--help"], { encoding: "utf8" }).stdout ?? "";
  for (const flag of [
    "--lang",
    "--output",
    "--registry",
    "--package-version",
    "--tag",
    "--dry-run",
  ]) {
    expect(help).toContain(flag);
  }
});
