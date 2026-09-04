import { createRequire } from 'node:module'

// Minimal shape of jsdiff's `merge()` output (the `diff` package ships no types).
/** A region both sides changed differently, inlined into a hunk's `lines`. */
interface Diff3ConflictLine {
  conflict: true
  /** Our-side lines, prefixed ' ' (context) / '+' (added) / '-' (removed). */
  mine: string[]
  /** Their-side lines, same prefix convention. */
  theirs: string[]
}
interface Diff3MergeHunk {
  oldStart: number
  oldLines: number
  lines: Array<string | Diff3ConflictLine>
}
interface Diff3MergePatch {
  hunks: Diff3MergeHunk[]
}

// Load jsdiff via createRequire (native CJS require) rather than a static import:
// `diff`'s `exports.import` .mjs entry trips vitest's SSR transform in this
// workspace, and the CJS build is what a node-target package wants anyway.
// LAZY (first merge3 call), not at module load: a createRequire call is
// invisible to bundlers, so an eager load breaks any bundled consumer that
// imports this package's barrel without ever merging — e.g. the compiled xyd
// binary loading @xyd-js/opensdk-framework for the docs SDK enrichment.
interface JsDiff {
  merge(mine: unknown, theirs: unknown, base: string): Diff3MergePatch
  structuredPatch(
    oldFileName: string,
    newFileName: string,
    oldStr: string,
    newStr: string,
    oldHeader: string,
    newHeader: string,
    options: { context: number },
  ): unknown
}
let _jsdiff: JsDiff | undefined
function jsdiff(): JsDiff {
  if (!_jsdiff) {
    _jsdiff = createRequire(import.meta.url)('diff') as JsDiff
  }
  return _jsdiff
}

/** Marker labels for a conflict block: `<<<<<<< ours` … `>>>>>>> theirs`. */
export interface Merge3Labels {
  /** Left side — the user's on-disk edits. Default `'ours'`. */
  ours?: string
  /** Right side — the freshly generated output. Default `'generated'`. */
  theirs?: string
}

export interface Merge3Options {
  labels?: Merge3Labels
}

export interface Merge3Result {
  /** The merged content. When `clean` is false it carries git-style conflict
   * blocks (`<<<<<<<` / `=======` / `>>>>>>>`) around the disagreeing regions. */
  text: string
  /** True when the merge produced no conflicts. */
  clean: boolean
  /** Number of conflict regions (0 when clean). */
  conflicts: number
}

const CONFLICT_START = '<<<<<<<'
const CONFLICT_SEP = '======='
const CONFLICT_END = '>>>>>>>'

/** Normalize CRLF/CR line endings to LF (SDK output is LF) so line-ending
 * differences don't surface as spurious conflicts. */
export function normalizeNewlines(content: string): string {
  return content.replace(/\r\n?/g, '\n')
}

/**
 * Cheap "is this text?" guard: a NUL byte or a high ratio of C0 control chars
 * means a line-based 3-way merge is unsafe — the caller should fall back to a
 * whole-file policy (overwrite / keep) rather than call {@link merge3}.
 */
export function isProbablyBinary(content: string): boolean {
  if (content.length === 0) return false
  const sample = content.length > 8192 ? content.slice(0, 8192) : content
  if (sample.includes('\u0000')) return true
  let control = 0
  for (let i = 0; i < sample.length; i++) {
    const c = sample.charCodeAt(i)
    // tab (9), LF (10), CR (13) are fine; count other C0 controls.
    if (c < 9 || (c > 13 && c < 32)) control++
  }
  return control / sample.length > 0.02
}

/** True when the text still contains unresolved git conflict markers. */
export function hasConflictMarkers(content: string): boolean {
  return content
    .split('\n')
    .some((l) => l.startsWith(CONFLICT_START) || l === CONFLICT_SEP || l.startsWith(CONFLICT_END))
}

/** The "kept" side of a hunk line-array: context (' ') + additions ('+'); '-' dropped. */
function kept(prefixed: string[]): string[] {
  return prefixed.filter((l) => l[0] === ' ' || l[0] === '+').map((l) => l.slice(1))
}

/**
 * A 3-way line merge: reconcile the user's on-disk edits
 * (`ours`) with a freshly generated file (`theirs`) against their common
 * ancestor (`base` — the previously-generated pristine content). Changes only
 * one side made are applied; a region both sides changed *differently* becomes
 * a git-style conflict block. Line-oriented and deterministic (never reorders
 * unchanged lines), so a no-op regen stays byte-stable.
 *
 * The 3-way diff itself is jsdiff's battle-tested `merge()`; this renders its
 * structured output back to file text with conflict markers we control. Inputs
 * are newline-normalized (→ LF); the trailing newline is preserved.
 */
export function merge3(base: string, ours: string, theirs: string, opts: Merge3Options = {}): Merge3Result {
  const labels = { ours: opts.labels?.ours ?? 'ours', theirs: opts.labels?.theirs ?? 'generated' }
  const b = normalizeNewlines(base)
  const o = normalizeNewlines(ours)
  const t = normalizeNewlines(theirs)

  // Fast paths — exact + correct, and they skip the diff for the common cases.
  if (o === t) return { text: o, clean: true, conflicts: 0 } // both sides identical
  if (b === o) return { text: t, clean: true, conflicts: 0 } // user didn't edit → take generated
  if (b === t) return { text: o, clean: true, conflicts: 0 } // generator unchanged → keep edits

  // jsdiff is line-oriented; strip the trailing newline before diffing so the
  // final '\n' never becomes a phantom conflict, then restore it after.
  // Output follows the generated (theirs) side's trailing-newline policy.
  const wantTrailing = t.endsWith('\n')
  // Give every input a trailing newline for a stable line-based diff — a missing
  // final newline would otherwise make an APPEND look like it edits the last
  // line and collide with a nearby edit. And build the two base->side patches
  // with context: 0 so nearby edits don't produce spurious CONFLICTs from
  // overlapping default context lines. jsdiff's `merge` reconciles the two.
  const nl = (s: string) => (s.endsWith('\n') ? s : `${s}\n`)
  const bb = nl(b)
  const jd = jsdiff()
  const patch = jd.merge(
    jd.structuredPatch('', '', bb, nl(o), '', '', { context: 0 }),
    jd.structuredPatch('', '', bb, nl(t), '', '', { context: 0 }),
    bb,
  )
  const baseLines = bb.split('\n')

  const out: string[] = []
  let conflicts = 0
  let cursor = 0 // index into baseLines
  for (const hunk of patch.hunks) {
    const hunkStart = hunk.oldStart - 1
    for (let i = cursor; i < hunkStart; i++) out.push(baseLines[i]) // unchanged gap before this hunk
    for (const line of hunk.lines) {
      if (typeof line === 'string') {
        if (line[0] === ' ' || line[0] === '+') out.push(line.slice(1)) // '-' (removed) → drop
      } else if ((line as Diff3ConflictLine).conflict) {
        conflicts++
        const c = line as Diff3ConflictLine
        out.push(`${CONFLICT_START} ${labels.ours}`, ...kept(c.mine), CONFLICT_SEP, ...kept(c.theirs), `${CONFLICT_END} ${labels.theirs}`)
      }
    }
    cursor = hunkStart + hunk.oldLines
  }
  for (let i = cursor; i < baseLines.length; i++) out.push(baseLines[i]) // trailing unchanged base

  let text = out.join('\n')
  if (!wantTrailing) text = text.replace(/\n$/, '')
  return { text, clean: conflicts === 0, conflicts }
}
