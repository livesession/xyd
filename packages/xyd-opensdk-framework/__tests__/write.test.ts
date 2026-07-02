import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { MANIFEST_FILENAME, deepMergeJson, writeProject } from '../src';

const tmpDirs: string[] = [];
function tmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'opensdk-write-'));
  tmpDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

const read = (dir: string, rel: string) => fs.readFileSync(path.join(dir, rel), 'utf8');
const exists = (dir: string, rel: string) => fs.existsSync(path.join(dir, rel));
const manifest = (dir: string) => JSON.parse(read(dir, MANIFEST_FILENAME));

describe('writeProject: basics + manifest', () => {
  it('writes the file map, returns a summary, and emits a deterministic manifest', async () => {
    const out = tmpDir();
    const result = await writeProject({ 'pkg/client.go': 'client', 'types.go': 'types' }, out);

    expect(read(out, 'pkg/client.go')).toBe('client');
    expect(read(out, 'types.go')).toBe('types');
    expect(result).toEqual({
      written: ['pkg/client.go', 'types.go'],
      skipped: [],
      unchanged: [],
      pruned: [],
      keptModified: [],
    });

    const m = manifest(out);
    expect(m.schemaVersion).toBe(1);
    expect(m.generator).toBe('opensdk');
    expect(Object.keys(m.files)).toEqual(['pkg/client.go', 'types.go']); // sorted
    expect(m.files['types.go']).toMatch(/^[0-9a-f]{64}$/);
    // Determinism: no timestamps anywhere.
    expect(read(out, MANIFEST_FILENAME)).not.toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it('records the generator name from options', async () => {
    const out = tmpDir();
    await writeProject({ 'a.go': 'a' }, out, { generator: 'go' });
    expect(manifest(out).generator).toBe('go');
  });

  it('rejects a file map that emits the manifest path itself', async () => {
    await expect(writeProject({ [MANIFEST_FILENAME]: '{}' }, tmpDir())).rejects.toThrow(/owns it/);
  });
});

describe('writeProject: identical-content no-op', () => {
  it('does not rewrite files whose on-disk bytes already match (mtime-stable)', async () => {
    const out = tmpDir();
    const files = { 'a.go': 'alpha', 'b.go': 'beta' };
    await writeProject(files, out);
    const before = fs.statSync(path.join(out, 'a.go')).mtimeMs;
    const manifestBefore = read(out, MANIFEST_FILENAME);

    const result = await writeProject(files, out);
    expect(result.written).toEqual([]);
    expect(result.unchanged).toEqual(['a.go', 'b.go']);
    expect(fs.statSync(path.join(out, 'a.go')).mtimeMs).toBe(before);
    // The manifest itself is byte-identical too — no-change regens are git-diff clean.
    expect(read(out, MANIFEST_FILENAME)).toBe(manifestBefore);
  });
});

describe('writeProject: writeMode', () => {
  it('skipIfExists never clobbers an existing file, but writes a missing one', async () => {
    const out = tmpDir();
    fs.writeFileSync(path.join(out, 'README.md'), 'user readme');

    const files = {
      'README.md': { content: 'generated readme', writeMode: 'skipIfExists' as const },
      'go.mod': { content: 'module demo\n', writeMode: 'skipIfExists' as const },
    };
    const result = await writeProject(files, out);
    expect(read(out, 'README.md')).toBe('user readme');
    expect(read(out, 'go.mod')).toBe('module demo\n');
    expect(result.skipped).toEqual(['README.md']);
    expect(result.written).toEqual(['go.mod']);
  });

  it('mergeJson deep-merges generated INTO existing: user keys win, arrays replace as a unit', async () => {
    const out = tmpDir();
    fs.writeFileSync(
      path.join(out, 'package.json'),
      JSON.stringify({ name: 'user-name', scripts: { dev: 'user-dev' }, keywords: ['user'] }, null, 2),
    );

    const generated = {
      name: 'generated-name',
      version: '1.0.0',
      scripts: { dev: 'gen-dev', build: 'gen-build' },
      keywords: ['generated', 'sdk'],
    };
    const result = await writeProject(
      { 'package.json': { content: JSON.stringify(generated), writeMode: 'mergeJson' } },
      out,
    );
    expect(result.written).toEqual(['package.json']);
    expect(JSON.parse(read(out, 'package.json'))).toEqual({
      name: 'user-name', // existing wins
      version: '1.0.0', // generated adds missing keys
      scripts: { dev: 'user-dev', build: 'gen-build' }, // per-key merge
      keywords: ['user'], // existing array replaces, never element-merged
    });
  });

  it('mergeJson writes canonical generated JSON when no file exists, and is idempotent', async () => {
    const out = tmpDir();
    const entry = { 'pkg.json': { content: '{"a":1,"b":[1,2]}', writeMode: 'mergeJson' as const } };
    await writeProject(entry, out);
    expect(read(out, 'pkg.json')).toBe(`${JSON.stringify({ a: 1, b: [1, 2] }, null, 2)}\n`);

    const again = await writeProject(entry, out);
    expect(again.unchanged).toEqual(['pkg.json']);
  });

  it('mergeJson leaves an unparseable existing file alone (skipped, never clobbered)', async () => {
    const out = tmpDir();
    fs.writeFileSync(path.join(out, 'broken.json'), '{not json');
    const result = await writeProject({ 'broken.json': { content: '{"a":1}', writeMode: 'mergeJson' } }, out);
    expect(result.skipped).toEqual(['broken.json']);
    expect(read(out, 'broken.json')).toBe('{not json');
  });
});

describe('writeProject: guarded stale-prune', () => {
  it('deletes pristine generated files that left the map (and empty parents)', async () => {
    const out = tmpDir();
    await writeProject({ 'a.go': 'a', 'old/stale.go': 'stale' }, out);

    const result = await writeProject({ 'a.go': 'a' }, out);
    expect(result.pruned).toEqual(['old/stale.go']);
    expect(result.keptModified).toEqual([]);
    expect(exists(out, 'old/stale.go')).toBe(false);
    expect(exists(out, 'old')).toBe(false); // empty parent removed
    expect(Object.keys(manifest(out).files)).toEqual(['a.go']);
  });

  it('keeps locally-modified orphans and reports them as warnings', async () => {
    const out = tmpDir();
    await writeProject({ 'a.go': 'a', 'stale.go': 'stale' }, out);
    fs.writeFileSync(path.join(out, 'stale.go'), 'user hand-edit');

    const result = await writeProject({ 'a.go': 'a' }, out);
    expect(result.pruned).toEqual([]);
    expect(result.keptModified).toEqual(['stale.go']);
    expect(read(out, 'stale.go')).toBe('user hand-edit');
  });

  it('never prunes on first adoption (no previous manifest)', async () => {
    const out = tmpDir();
    fs.writeFileSync(path.join(out, 'preexisting.go'), 'not ours (yet)');

    const result = await writeProject({ 'a.go': 'a' }, out);
    expect(result.pruned).toEqual([]);
    expect(result.keptModified).toEqual([]);
    expect(read(out, 'preexisting.go')).toBe('not ours (yet)');
  });

  it('keeps a user-customized skipIfExists scaffold even after it leaves the map', async () => {
    const out = tmpDir();
    fs.writeFileSync(path.join(out, 'README.md'), 'user readme');
    await writeProject({ 'a.go': 'a', 'README.md': { content: 'generated', writeMode: 'skipIfExists' } }, out);

    // README.md's manifest hash is the pristine CANDIDATE, so the user's file never matches.
    const result = await writeProject({ 'a.go': 'a' }, out);
    expect(result.keptModified).toEqual(['README.md']);
    expect(read(out, 'README.md')).toBe('user readme');
  });

  it('ignores a malformed previous manifest (no prune)', async () => {
    const out = tmpDir();
    await writeProject({ 'a.go': 'a', 'stale.go': 'stale' }, out);
    fs.writeFileSync(path.join(out, MANIFEST_FILENAME), 'garbage');

    const result = await writeProject({ 'a.go': 'a' }, out);
    expect(result.pruned).toEqual([]);
    expect(exists(out, 'stale.go')).toBe(true);
  });
});

describe('deepMergeJson', () => {
  it('existing wins on conflicts; keys union; arrays and primitives replace as units', () => {
    expect(deepMergeJson({ a: 1, b: { x: 1, y: 1 }, c: [1] }, { a: 2, b: { x: 2, z: 2 }, d: 4 })).toEqual({
      a: 2,
      b: { x: 2, y: 1, z: 2 },
      c: [1],
      d: 4,
    });
    expect(deepMergeJson([1, 2], [3])).toEqual([3]);
    expect(deepMergeJson({ a: 1 }, null)).toBeNull();
  });
});
