import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { applyOverlay, detectChain, mergeOpenApiDocs, processSource, readRawDoc, resolveChain } from '../index';

/**
 * FROZEN ORACLE for the Rust port (`crates/xyd_opensdk_chain`).
 *
 * The hand-written assertions in `sources.test.ts` / `chain.test.ts` prove the TS does
 * what someone once expected. This file instead records what the TS *actually produces*
 * over a corpus, byte-for-byte, so the Rust port can be gated on it:
 *
 *   O2S_BUILD_DOCS=1 pnpm vitest run __tests__/oracle.test.ts   # (re)generate output.json
 *   pnpm vitest run __tests__/oracle.test.ts                    # guard: TS still matches
 *
 * The committed `__oracle__/<case>/output.json` files ARE the contract. Rust never
 * rewrites them; regeneration stays an explicit act on THIS side.
 *
 * Cases 07–10 deliberately reuse the real committed chain fixtures
 * (`__fixtures__/chain/<n>.<name>`) as their corpus — copied into a temp work dir so
 * nothing under `__fixtures__/` is ever written to.
 */

const ORACLE_DIR = path.join(__dirname, '__oracle__');
const BUILD = process.env.O2S_BUILD_DOCS === '1';

interface OpBase {
  id: string;
  op: string;
}
type Op = OpBase & Record<string, any>;

interface CaseFile {
  description?: string;
  /** Copy this directory (relative to the case dir) into the work dir before running ops. */
  copyFrom?: string;
  ops: Op[];
}

type OpResult = { ok: true; value: unknown } | { ok: false; error: string };

/**
 * Machine paths must never leak into a committed golden — nor may the random suffix
 * `mkdtempSync` gives `processSource`'s fallback output dir, or the golden would differ
 * on every run.
 */
function scrub(text: string, work: string): string {
  let out = text.split(fs.realpathSync(work)).join('<CWD>').split(work).join('<CWD>');
  const tmp = os.tmpdir();
  out = out.split(fs.realpathSync(tmp)).join('<TMP>').split(tmp).join('<TMP>');
  return out.replace(/opensdk-chain-src-[A-Za-z0-9]+/g, 'opensdk-chain-src-<RAND>');
}

async function runOp(op: Op, work: string): Promise<OpResult> {
  switch (op.op) {
    case 'readRawDoc':
      return { ok: true, value: await readRawDoc(op.location, work) };

    case 'mergeOpenApiDocs': {
      const docs = [];
      for (const loc of op.inputs as string[]) docs.push(await readRawDoc(loc, work));
      return { ok: true, value: mergeOpenApiDocs(docs) };
    }

    case 'applyOverlay': {
      const doc = await readRawDoc(op.doc, work);
      const overlay = await readRawDoc(op.overlay, work);
      return { ok: true, value: applyOverlay(doc, overlay) };
    }

    case 'processSource': {
      const outPath = await processSource(op.source, work);
      const content = fs.readFileSync(outPath, 'utf8');
      return { ok: true, value: { outPath: scrub(outPath, work), content } };
    }

    case 'processSourceFromChain': {
      const chain = await resolveChain(op.chainPath, work);
      const src = chain.sources[op.source as string];
      if (!src) throw new Error(`oracle: chain has no source "${op.source}"`);
      const outPath = await processSource(src, work);
      const content = fs.readFileSync(outPath, 'utf8');
      return { ok: true, value: { outPath: scrub(outPath, work), content } };
    }

    case 'detectChain': {
      const found = detectChain(work, op.explicitPath);
      return { ok: true, value: found === null ? null : scrub(found, work) };
    }

    case 'resolveChain':
      return { ok: true, value: await resolveChain(op.chainPath, work) };

    default:
      throw new Error(`oracle: unknown op "${op.op}"`);
  }
}

async function runCase(caseDir: string): Promise<Record<string, OpResult>> {
  const spec = JSON.parse(fs.readFileSync(path.join(caseDir, 'case.json'), 'utf8')) as CaseFile;
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'opensdk-chain-oracle-'));
  try {
    const src = spec.copyFrom ? path.resolve(caseDir, spec.copyFrom) : caseDir;
    fs.cpSync(src, work, { recursive: true });
    fs.rmSync(path.join(work, 'output.json'), { force: true });

    const out: Record<string, OpResult> = {};
    for (const op of spec.ops) {
      try {
        out[op.id] = await runOp(op, work);
      } catch (err) {
        out[op.id] = { ok: false, error: scrub(err instanceof Error ? err.message : String(err), work) };
      }
    }
    return out;
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

const cases = fs
  .readdirSync(ORACLE_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory() && /^\d/.test(e.name))
  .map((e) => e.name)
  .sort();

describe(`chain rust-port oracle (${BUILD ? 'GENERATING' : 'guarding'})`, () => {
  it('has cases', () => {
    expect(cases.length).toBeGreaterThan(0);
  });

  for (const name of cases) {
    it(name, async () => {
      const produced = await runCase(path.join(ORACLE_DIR, name));
      const goldenPath = path.join(ORACLE_DIR, name, 'output.json');
      const rendered = `${JSON.stringify(produced, null, 2)}\n`;
      if (BUILD) {
        fs.writeFileSync(goldenPath, rendered);
        return;
      }
      expect(fs.existsSync(goldenPath), `${name}: missing output.json (run with O2S_BUILD_DOCS=1)`).toBe(true);
      expect(rendered, `${name}: TS drifted from its own frozen oracle`).toEqual(fs.readFileSync(goldenPath, 'utf8'));
    }, 60000);
  }
});
