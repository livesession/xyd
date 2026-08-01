import { describe, expect, it } from 'vitest'

import { hasConflictMarkers, isProbablyBinary, merge3, normalizeNewlines } from '../src'

const BASE = 'line1\nline2\nline3\nline4\nline5\n'

describe('merge3: clean merges', () => {
  it('combines disjoint edits from both sides', () => {
    const ours = 'line1\nOURS2\nline3\nline4\nline5\n' // edited line 2
    const theirs = 'line1\nline2\nline3\nTHEIRS4\nline5\n' // edited line 4
    const r = merge3(BASE, ours, theirs)
    expect(r).toEqual({ text: 'line1\nOURS2\nline3\nTHEIRS4\nline5\n', clean: true, conflicts: 0 })
  })

  it('keeps a user edit while applying a generator ADDITION elsewhere', () => {
    const r = merge3('a\nb\nc\n', 'a\nBB\nc\n', 'a\nb\nc\nd\n') // user edits b; generator appends d
    expect(r.text).toBe('a\nBB\nc\nd\n')
    expect(r.clean).toBe(true)
  })

  it('keeps the user edit when the generator did not change the file (base === theirs)', () => {
    const ours = 'line1\nOURS2\nline3\nline4\nline5\n'
    expect(merge3(BASE, ours, BASE)).toEqual({ text: ours, clean: true, conflicts: 0 })
  })

  it('takes the generated file when the user did not edit (base === ours)', () => {
    const theirs = 'line1\nline2\nNEW3\nline4\nline5\n'
    expect(merge3(BASE, BASE, theirs)).toEqual({ text: theirs, clean: true, conflicts: 0 })
  })

  it('is a no-op when both sides are identical', () => {
    expect(merge3(BASE, 'x\ny\n', 'x\ny\n')).toEqual({ text: 'x\ny\n', clean: true, conflicts: 0 })
  })

  it('applies a user DELETION the generator left untouched', () => {
    const ours = 'line1\nline3\nline4\nline5\n' // user deleted line2
    const theirs = BASE
    expect(merge3(BASE, ours, theirs).text).toBe(ours)
  })

  it('merges two far-apart hunks (multi-hunk)', () => {
    const base = 'a\nb\nc\nd\ne\nf\ng\n'
    const ours = 'A\nb\nc\nd\ne\nf\ng\n' // edit first line
    const theirs = 'a\nb\nc\nd\ne\nf\nG\n' // edit last line
    expect(merge3(base, ours, theirs).text).toBe('A\nb\nc\nd\ne\nf\nG\n')
  })
})

describe('merge3: conflicts', () => {
  it('emits git-style markers when both sides change the same region differently', () => {
    const ours = 'line1\nOURS2\nline3\nline4\nline5\n'
    const theirs = 'line1\nTHEIRS2\nline3\nline4\nline5\n'
    const r = merge3(BASE, ours, theirs)
    expect(r.clean).toBe(false)
    expect(r.conflicts).toBe(1)
    expect(r.text).toBe(
      'line1\n<<<<<<< ours\nOURS2\n=======\nTHEIRS2\n>>>>>>> generated\nline3\nline4\nline5\n',
    )
    expect(hasConflictMarkers(r.text)).toBe(true)
  })

  it('honors custom conflict labels', () => {
    const r = merge3('a\n', 'MINE\n', 'GEN\n', { labels: { ours: 'my-edits', theirs: 'opensdk' } })
    expect(r.text).toContain('<<<<<<< my-edits')
    expect(r.text).toContain('>>>>>>> opensdk')
  })
})

describe('merge3: newline handling', () => {
  it('preserves a missing trailing newline', () => {
    expect(merge3('a\nb', 'a\nB', 'a\nb').text).toBe('a\nB')
  })

  it('normalizes CRLF to LF so line endings do not cause spurious conflicts', () => {
    const ours = 'line1\r\nOURS2\r\nline3\r\nline4\r\nline5\r\n' // same edit as clean case, but CRLF
    const theirs = 'line1\nline2\nline3\nTHEIRS4\nline5\n'
    const r = merge3(BASE, ours, theirs)
    expect(r.clean).toBe(true)
    expect(r.text).toBe('line1\nOURS2\nline3\nTHEIRS4\nline5\n')
  })
})

describe('guards', () => {
  it('isProbablyBinary flags NUL bytes, passes normal code', () => {
    expect(isProbablyBinary('package main\n\nfunc main() {}\n')).toBe(false)
    expect(isProbablyBinary(String.fromCharCode(80, 75, 0, 0, 98, 105, 110, 97, 114, 121))).toBe(true)
    expect(isProbablyBinary('')).toBe(false)
  })

  it('hasConflictMarkers detects unresolved markers', () => {
    expect(hasConflictMarkers('clean\ncode\n')).toBe(false)
    expect(hasConflictMarkers('a\n<<<<<<< ours\nx\n=======\ny\n>>>>>>> generated\nb\n')).toBe(true)
  })

  it('normalizeNewlines collapses CRLF and lone CR to LF', () => {
    expect(normalizeNewlines('a\r\nb\rc\nd')).toBe('a\nb\nc\nd')
  })
})
