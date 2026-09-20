/**
 * Oracle runner for `runOpensdkPreview`.
 *
 *   bun run __oracle__/run.ts --freeze   # (re)write goldens
 *   bun run __oracle__/run.ts            # check against goldens
 *
 * It drives the REAL exported `runOpensdkPreview`, not an internal reimplementation, so
 * it keeps measuring the public contract after the internals are swapped to native.
 *
 * Output is captured VERBATIM and order-preserving. Order is load-bearing: `files[0]` is
 * the default-selected file and `operations[0]` the selection fallback, both consumed
 * positionally by the UI. Nothing here sorts, normalizes, or strips — cosmetic churn is
 * meant to be detectable.
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CASES, LANGUAGES } from "./cases";
import { runOpensdkPreview } from "../src/preview/index";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GOLDEN = path.join(HERE, "golden");
const FREEZE = process.argv.includes("--freeze");

/** Fail loudly if the native addon is missing.
 *
 * Without this, a freeze on a machine with no addon would silently bake the JS-impl
 * error string (case 5 differs by a `[openapi2opensdk] ` prefix) and every later
 * check would go red for the wrong reason. */
function assertNative(): void {
  if (process.env.XYD_NATIVE === "0") {
    console.error(
      "XYD_NATIVE=0 — the oracle must run against the native path (production truth).",
    );
    process.exit(2);
  }
  try {
    createRequire(import.meta.url)("@xyd-js/native");
  } catch (e) {
    console.error(
      "@xyd-js/native could not be resolved; the oracle would freeze the wrong baseline.\n" +
        "Build it with: pnpm --filter @xyd-js/native build:native\n" +
        `  (${e instanceof Error ? e.message : e})`,
    );
    process.exit(2);
  }
}

interface Result {
  files?: { path: string; code: string; language: string }[];
  operations?: { id: string; code: string }[];
  usage?: string;
  defaultOperationId?: string;
  error?: string;
}

/** Per-key diff counts. A bare pass/fail can't tell you whether a red is the one you
 * intended, which is the whole point when perturbing deliberately. */
function describeDiff(want: Result, got: Result): string[] {
  const out: string[] = [];
  const wf = new Map((want.files ?? []).map((f) => [f.path, f.code]));
  const gf = new Map((got.files ?? []).map((f) => [f.path, f.code]));
  const added = [...gf.keys()].filter((p) => !wf.has(p));
  const removed = [...wf.keys()].filter((p) => !gf.has(p));
  const changed = [...wf.keys()].filter(
    (p) => gf.has(p) && gf.get(p) !== wf.get(p),
  );
  if (added.length) out.push(`files +${added.length} (${added.slice(0, 3)})`);
  if (removed.length)
    out.push(`files -${removed.length} (${removed.slice(0, 3)})`);
  if (changed.length)
    out.push(`files ~${changed.length} (${changed.slice(0, 3)})`);

  const wOrder = (want.files ?? []).map((f) => f.path).join("|");
  const gOrder = (got.files ?? []).map((f) => f.path).join("|");
  if (wOrder !== gOrder && !added.length && !removed.length)
    out.push("file ORDER changed");

  const wo = new Map((want.operations ?? []).map((o) => [o.id, o.code]));
  const go = new Map((got.operations ?? []).map((o) => [o.id, o.code]));
  const oAdded = [...go.keys()].filter((i) => !wo.has(i));
  const oRemoved = [...wo.keys()].filter((i) => !go.has(i));
  const oChanged = [...wo.keys()].filter(
    (i) => go.has(i) && go.get(i) !== wo.get(i),
  );
  if (oAdded.length) out.push(`ops +${oAdded.length} (${oAdded.slice(0, 3)})`);
  if (oRemoved.length)
    out.push(`ops -${oRemoved.length} (${oRemoved.slice(0, 3)})`);
  if (oChanged.length)
    out.push(`ops ~${oChanged.length} (${oChanged.slice(0, 3)})`);

  if (want.usage !== got.usage) out.push("usage changed");
  if (want.defaultOperationId !== got.defaultOperationId)
    out.push(`defaultOperationId ${want.defaultOperationId} -> ${got.defaultOperationId}`);
  if (want.error !== got.error)
    out.push(`error ${JSON.stringify(want.error)} -> ${JSON.stringify(got.error)}`);
  return out;
}

async function main(): Promise<void> {
  assertNative();
  fs.mkdirSync(GOLDEN, { recursive: true });

  let pass = 0;
  const failures: string[] = [];

  for (const c of CASES) {
    for (const language of LANGUAGES) {
      const name = `${c.id}.${language}.json`;
      const file = path.join(GOLDEN, name);
      const result = (await runOpensdkPreview({
        language,
        specId: "petstore",
        sdkJson: c.sdkJson,
        ...(c.doc ? { doc: c.doc } : {}),
      } as never)) as Result;
      const actual = `${JSON.stringify(result, null, 2)}\n`;

      if (FREEZE) {
        fs.writeFileSync(file, actual);
        continue;
      }
      if (!fs.existsSync(file)) {
        failures.push(`${name}: NO GOLDEN (run --freeze)`);
        continue;
      }
      const expected = fs.readFileSync(file, "utf8");
      if (expected === actual) {
        pass++;
      } else {
        const diff = describeDiff(JSON.parse(expected), result);
        failures.push(
          `${name}  [${c.axis}]\n      ${diff.length ? diff.join("\n      ") : "byte-level difference with no structural change"}`,
        );
      }
    }
  }

  const total = CASES.length * LANGUAGES.length;
  if (FREEZE) {
    console.log(`froze ${total} goldens -> ${path.relative(process.cwd(), GOLDEN)}`);
    return;
  }
  if (failures.length) {
    console.error(`ORACLE FAILED: ${failures.length}/${total}\n`);
    for (const f of failures) console.error(`  ${f}`);
    process.exit(1);
  }
  console.log(`oracle ok: ${pass}/${total} goldens match`);
}

await main();
