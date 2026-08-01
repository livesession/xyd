import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { writeProject } from '../src'

// Real-life regeneration scenarios, input/output style. Each fixture under
// __fixtures__/merge/<scenario>/ is a mini SDK where:
//   base/       — what `opensdk generate` produced LAST time
//   local/      — the user's working copy (base + their hand-edits + owned files)
//   generated/  — what `opensdk generate` produces TODAY (spec changed)
//   expected/   — the working tree after `opensdk generate --merge` (the golden)
//   result.json — the writeProject summary (written/merged/mergeConflicts/…)
//
// Regenerate the goldens after changing an input: O2M_BUILD_FIXTURES=1 vitest run.

const FIXTURES = path.join(__dirname, '..', '__fixtures__', 'merge')
const BUILD = process.env.O2M_BUILD_FIXTURES === '1'

const tmpDirs: string[] = []
afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.rmSync(d, { recursive: true, force: true })
})
function tmpDir(): string {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'opensdk-merge-fx-'))
  tmpDirs.push(d)
  return d
}

/** Read every file under `root` into { posixRelPath: content } (relative to `root`), skipping .sdk/. */
function readTree(root: string): Record<string, string> {
  const out: Record<string, string> = {}
  if (!fs.existsSync(root)) return out
  const walk = (rel: string) => {
    for (const name of fs.readdirSync(path.join(root, rel)).sort()) {
      const childRel = rel ? `${rel}/${name}` : name
      if (childRel === '.sdk' || childRel.startsWith('.sdk/')) continue
      const full = path.join(root, childRel)
      if (fs.statSync(full).isDirectory()) walk(childRel)
      else out[childRel] = fs.readFileSync(full, 'utf8')
    }
  }
  walk('')
  return out
}

function writeTree(dir: string, tree: Record<string, string>): void {
  fs.rmSync(dir, { recursive: true, force: true })
  for (const [rel, content] of Object.entries(tree)) {
    const full = path.join(dir, rel)
    fs.mkdirSync(path.dirname(full), { recursive: true })
    fs.writeFileSync(full, content)
  }
}

const scenarios = fs
  .readdirSync(FIXTURES)
  .filter((d) => fs.statSync(path.join(FIXTURES, d)).isDirectory())
  .sort()

describe('writeProject: merge — real regeneration scenarios (__fixtures__/merge)', () => {
  for (const scenario of scenarios) {
    it(scenario, async () => {
      const dir = path.join(FIXTURES, scenario)
      const base = readTree(path.join(dir, 'base'))
      const local = readTree(path.join(dir, 'local'))
      const generated = readTree(path.join(dir, 'generated'))

      const tmp = tmpDir()
      // 1. the PREVIOUS `opensdk generate --merge` (writes files + the base snapshot)
      await writeProject(base, tmp, { merge: true })
      // 2. the user's working copy: their hand-edits + owned files on top
      for (const [rel, content] of Object.entries(local)) {
        const full = path.join(tmp, rel)
        fs.mkdirSync(path.dirname(full), { recursive: true })
        fs.writeFileSync(full, content)
      }
      // 3. TODAY's `opensdk generate --merge`
      const r = await writeProject(generated, tmp, { merge: true })

      const actual = readTree(tmp)
      const summary = {
        written: r.written,
        unchanged: r.unchanged,
        merged: r.merged,
        mergeConflicts: r.mergeConflicts,
        conflicts: r.conflicts,
        skipped: r.skipped,
        keptModified: r.keptModified,
        pruned: r.pruned,
      }

      if (BUILD) {
        writeTree(path.join(dir, 'expected'), actual)
        fs.writeFileSync(path.join(dir, 'result.json'), `${JSON.stringify(summary, null, 2)}\n`)
        return
      }
      expect(actual).toEqual(readTree(path.join(dir, 'expected')))
      expect(summary).toEqual(JSON.parse(fs.readFileSync(path.join(dir, 'result.json'), 'utf8')))
    })
  }
})
