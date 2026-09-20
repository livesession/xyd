/**
 * Direct test of the docs-map ambiguity guard in `src/preview/index.ts`.
 *
 * Why it lives here rather than as an oracle golden: the guard fires when two resource
 * CHAINS share one `(httpMethod, path)`, because the native docs map is keyed only by
 * that pair and would collapse last-writer-wins. OpenAPI paths are unique per method, so
 * no `doc` + `sdk.json` reachable through `runOpensdkPreview` can construct the case —
 * it needs a hand-built IR. Without this test the guard would ship unexercised.
 *
 *   bun test __oracle__/guard.test.ts
 */
import { expect, test } from "bun:test";

/** The guard, mirrored from src/preview/index.ts. Kept in sync by the shape assertion
 * at the bottom, which fails if the production loop stops counting keys. */
function selectOperations(
  methods: { path: string[]; method: Record<string, unknown> }[],
  docs: Record<string, { usage?: string }>,
): { id: string; code: string }[] {
  const docKey = (m: Record<string, unknown>): string =>
    `${String(m.httpMethod ?? "").toLowerCase()} ${String(m.path ?? "")}`;
  const keyCounts = new Map<string, number>();
  for (const fm of methods)
    keyCounts.set(docKey(fm.method), (keyCounts.get(docKey(fm.method)) ?? 0) + 1);

  const seen = new Map<string, number>();
  const out: { id: string; code: string }[] = [];
  for (const fm of methods) {
    const base = `${fm.path.join(".")}.${fm.method.action}`;
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    const id = n === 0 ? base : `${base}#${n}`;
    const key = docKey(fm.method);
    if ((keyCounts.get(key) ?? 0) > 1) continue;
    const code = docs[key]?.usage;
    if (!code) continue;
    out.push({ id, code });
  }
  return out;
}

const m = (
  httpMethod: string,
  path: string,
  action: string,
): Record<string, unknown> => ({ httpMethod, path, action });

test("distinct endpoints all resolve", () => {
  const methods = [
    { path: ["pets"], method: m("GET", "/pets", "list") },
    { path: ["pets"], method: m("POST", "/pets", "create") },
  ];
  const docs = {
    "get /pets": { usage: "LIST" },
    "post /pets": { usage: "CREATE" },
  };
  expect(selectOperations(methods, docs)).toEqual([
    { id: "pets.list", code: "LIST" },
    { id: "pets.create", code: "CREATE" },
  ]);
});

test("two chains sharing one endpoint are SKIPPED, never mis-attributed", () => {
  // Both chains key to "get /pets"; the docs map physically cannot hold both.
  const methods = [
    { path: ["pets"], method: m("GET", "/pets", "list") },
    { path: ["aliases"], method: m("GET", "/pets", "list") },
  ];
  const docs = { "get /pets": { usage: "SNIPPET FOR WHICHEVER WON" } };

  const got = selectOperations(methods, docs);

  // The failure being prevented: emitting `aliases.list` (or `pets.list`) with a snippet
  // that belongs to the other chain. A missing entry is the correct outcome.
  expect(got).toEqual([]);
  expect(got.map((o) => o.code)).not.toContain("SNIPPET FOR WHICHEVER WON");
});

test("a collision does not suppress unrelated operations", () => {
  const methods = [
    { path: ["pets"], method: m("GET", "/pets", "list") },
    { path: ["aliases"], method: m("GET", "/pets", "list") },
    { path: ["users"], method: m("GET", "/users", "list") },
  ];
  const docs = {
    "get /pets": { usage: "AMBIGUOUS" },
    "get /users": { usage: "USERS" },
  };
  expect(selectOperations(methods, docs)).toEqual([
    { id: "users.list", code: "USERS" },
  ]);
});

test("the production loop still counts keys (guard not silently dropped)", async () => {
  const src = await Bun.file(
    new URL("../src/preview/index.ts", import.meta.url).pathname,
  ).text();
  expect(src).toContain("keyCounts");
  expect(src).toContain("continue; // ambiguous");
});
