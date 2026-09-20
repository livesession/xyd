/**
 * Oracle runner for `generateSdkFileMap`.
 *
 *   bun run genframework/__oracle__/run.ts --freeze   # (re)write goldens
 *   bun run genframework/__oracle__/run.ts            # check against goldens
 *
 * Drives the REAL exported function, so it keeps measuring the contract after the
 * internals are swapped off the TypeScript opensdk packages.
 *
 * Captures the file map VERBATIM, including `.sdk/sdk.lock` — that manifest ships in the
 * delivered SDK tree, so a change to it is a real change, not noise to be normalized away.
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateSdkFileMap } from "../sdk";
import { CASES, LANGUAGES } from "./cases";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GOLDEN = path.join(HERE, "golden");
const FREEZE = process.argv.includes("--freeze");
// The converter's own basic fixture, now in the `opensdk` submodule (its
// TypeScript twin was deleted with the rest of the TS cluster).
const SPEC = path.resolve(
  HERE,
  "../../../../opensdk/crates/openapi2opensdk/__fixtures__/1.basic/input.json",
);

/** Fail loudly if the native addon is missing: the compute already routes through it
 * (generateFileMap dispatches natively), so a freeze without it would bake a different
 * baseline and every later check would go red for the wrong reason. */
function assertNative(): void {
  if (process.env.XYD_NATIVE === "0") {
    console.error(
      "XYD_NATIVE=0 — the oracle must run against the native path.",
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

interface Shape {
  files: Record<string, string>;
  packageName: string;
  version: string;
  sdkJson: string;
}

function describeDiff(want: Shape, got: Shape): string[] {
  const out: string[] = [];
  const wf = want.files ?? {};
  const gf = got.files ?? {};
  const added = Object.keys(gf).filter((p) => !(p in wf));
  const removed = Object.keys(wf).filter((p) => !(p in gf));
  const changed = Object.keys(wf).filter((p) => p in gf && gf[p] !== wf[p]);
  if (added.length) out.push(`files +${added.length} (${added.slice(0, 3)})`);
  if (removed.length)
    out.push(`files -${removed.length} (${removed.slice(0, 3)})`);
  if (changed.length)
    out.push(`files ~${changed.length} (${changed.slice(0, 3)})`);
  if (changed.includes(".sdk/sdk.lock"))
    out.push("!! .sdk/sdk.lock changed — it ships in the delivered tree");
  if (want.packageName !== got.packageName)
    out.push(`packageName ${want.packageName} -> ${got.packageName}`);
  if (want.version !== got.version)
    out.push(`version ${want.version} -> ${got.version}`);
  if (want.sdkJson !== got.sdkJson) out.push("sdk.json content changed");
  return out;
}

async function main(): Promise<void> {
  assertNative();
  fs.mkdirSync(GOLDEN, { recursive: true });
  const doc = JSON.parse(fs.readFileSync(SPEC, "utf8"));

  let pass = 0;
  const failures: string[] = [];

  for (const c of CASES) {
    for (const language of LANGUAGES) {
      const name = `${c.id}.${language}.json`;
      const file = path.join(GOLDEN, name);
      const result = (await generateSdkFileMap({
        doc,
        language,
        namespace: "acme",
        ...c.opts,
      } as never)) as Shape;
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
          `${name}  [${c.axis}]\n      ${diff.length ? diff.join("\n      ") : "byte difference with no structural change"}`,
        );
      }
    }
  }

  const total = CASES.length * LANGUAGES.length;
  if (FREEZE) {
    console.log(
      `froze ${total} goldens -> ${path.relative(process.cwd(), GOLDEN)}`,
    );
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
