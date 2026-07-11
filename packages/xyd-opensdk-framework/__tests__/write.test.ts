import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  SDK_IGNORE_FILENAME,
  SDK_LOCK_FILENAME,
  deepMergeJson,
  isSdkIgnored,
  materializeProject,
  parseSdkIgnore,
  writeProject,
} from '../src';

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
const manifest = (dir: string) => JSON.parse(read(dir, SDK_LOCK_FILENAME));

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
      conflicts: [],
    });

    const m = manifest(out);
    expect(m.schemaVersion).toBe(1);
    expect(m.generator).toBe('opensdk');
    expect(Object.keys(m.files)).toEqual(['pkg/client.go', 'types.go']); // sorted
    expect(m.files['types.go']).toMatch(/^[0-9a-f]{64}$/);
    // Determinism: no timestamps anywhere.
    expect(read(out, SDK_LOCK_FILENAME)).not.toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it('records the generator name from options', async () => {
    const out = tmpDir();
    await writeProject({ 'a.go': 'a' }, out, { generator: 'go' });
    expect(manifest(out).generator).toBe('go');
  });

  it('rejects a file map that emits the manifest path itself', async () => {
    await expect(writeProject({ [SDK_LOCK_FILENAME]: '{}' }, tmpDir())).rejects.toThrow(/owns it/);
  });
});

describe('writeProject: identical-content no-op', () => {
  it('does not rewrite files whose on-disk bytes already match (mtime-stable)', async () => {
    const out = tmpDir();
    const files = { 'a.go': 'alpha', 'b.go': 'beta' };
    await writeProject(files, out);
    const before = fs.statSync(path.join(out, 'a.go')).mtimeMs;
    const manifestBefore = read(out, SDK_LOCK_FILENAME);

    const result = await writeProject(files, out);
    expect(result.written).toEqual([]);
    expect(result.unchanged).toEqual(['a.go', 'b.go']);
    expect(fs.statSync(path.join(out, 'a.go')).mtimeMs).toBe(before);
    // The manifest itself is byte-identical too — no-change regens are git-diff clean.
    expect(read(out, SDK_LOCK_FILENAME)).toBe(manifestBefore);
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
    fs.writeFileSync(path.join(out, SDK_LOCK_FILENAME), 'garbage');

    const result = await writeProject({ 'a.go': 'a' }, out);
    expect(result.pruned).toEqual([]);
    expect(exists(out, 'stale.go')).toBe(true);
  });
});

describe('writeProject: .sdkignore (user-owned protection)', () => {
  const ignore = (dir: string, body: string) => fs.writeFileSync(path.join(dir, SDK_IGNORE_FILENAME), body);

  it('never overwrites an ignored existing file, and reports the conflict', async () => {
    const out = tmpDir();
    fs.writeFileSync(path.join(out, 'client.go'), 'my hand-tuned client');
    ignore(out, 'client.go\n');

    const result = await writeProject({ 'client.go': 'GENERATED client', 'types.go': 'types' }, out);

    expect(read(out, 'client.go')).toBe('my hand-tuned client'); // kept
    expect(read(out, 'types.go')).toBe('types'); // non-ignored still written
    expect(result.conflicts).toEqual(['client.go']);
    expect(result.written).toEqual(['types.go']);
  });

  it('wins over writeMode: an ignored overwrite/mergeJson file is left alone', async () => {
    const out = tmpDir();
    fs.writeFileSync(path.join(out, 'package.json'), '{"name":"mine"}');
    ignore(out, 'package.json\n');

    const result = await writeProject(
      { 'package.json': { content: '{"name":"generated","version":"1.0.0"}', writeMode: 'mergeJson' } },
      out,
    );
    expect(read(out, 'package.json')).toBe('{"name":"mine"}'); // not merged, not touched
    expect(result.conflicts).toEqual(['package.json']);
  });

  it('reports no conflict when the ignored file already matches the generated output', async () => {
    const out = tmpDir();
    fs.writeFileSync(path.join(out, 'client.go'), 'same');
    ignore(out, 'client.go\n');

    const result = await writeProject({ 'client.go': 'same' }, out);
    expect(result.conflicts).toEqual([]);
    expect(result.unchanged).toEqual(['client.go']);
  });

  it('still bootstraps an ignored file that does not exist yet ("never overwrite", not "never generate")', async () => {
    const out = tmpDir();
    ignore(out, 'client.go\n');

    const result = await writeProject({ 'client.go': 'generated' }, out);
    expect(read(out, 'client.go')).toBe('generated');
    expect(result.written).toEqual(['client.go']);
    expect(result.conflicts).toEqual([]);
  });

  it('honors glob patterns (protects every match)', async () => {
    const out = tmpDir();
    fs.mkdirSync(path.join(out, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(out, 'docs', 'guide.md'), 'user docs');
    fs.writeFileSync(path.join(out, 'README.md'), 'user readme');
    ignore(out, '*.md\n');

    const result = await writeProject(
      { 'docs/guide.md': 'gen guide', 'README.md': 'gen readme', 'main.go': 'main' },
      out,
    );
    expect(read(out, 'docs/guide.md')).toBe('user docs');
    expect(read(out, 'README.md')).toBe('user readme');
    expect(read(out, 'main.go')).toBe('main');
    expect(result.conflicts).toEqual(['README.md', 'docs/guide.md']); // sorted
    expect(result.written).toEqual(['main.go']);
  });

  it('protects an ignored file from the guarded stale-prune', async () => {
    const out = tmpDir();
    ignore(out, 'extra.go\n');
    // Bootstrap it, then the emitter stops producing it — a normal file would be pruned.
    await writeProject({ 'a.go': 'a', 'extra.go': 'extra' }, out);
    const result = await writeProject({ 'a.go': 'a' }, out);

    expect(result.pruned).toEqual([]);
    expect(exists(out, 'extra.go')).toBe(true);
  });
});

describe('isSdkIgnored / parseSdkIgnore', () => {
  it('parseSdkIgnore drops blanks + comments, keeps order', () => {
    expect(parseSdkIgnore('# a comment\n\nclient.go\n  README.md  \n')).toEqual(['client.go', 'README.md']);
    expect(parseSdkIgnore(null)).toEqual([]);
  });

  it('matches gitignore-style patterns', () => {
    // bare name → any depth
    expect(isSdkIgnored('client.go', ['client.go'])).toBe(true);
    expect(isSdkIgnored('pkg/client.go', ['client.go'])).toBe(true);
    expect(isSdkIgnored('client.go', ['other.go'])).toBe(false);
    // anchored (has a slash) → root only
    expect(isSdkIgnored('src/config.go', ['src/config.go'])).toBe(true);
    expect(isSdkIgnored('deep/src/config.go', ['src/config.go'])).toBe(false);
    expect(isSdkIgnored('LICENSE', ['/LICENSE'])).toBe(true);
    // globs
    expect(isSdkIgnored('README.md', ['*.md'])).toBe(true);
    expect(isSdkIgnored('a/b/notes.md', ['*.md'])).toBe(true);
    expect(isSdkIgnored('main.go', ['*.md'])).toBe(false);
    expect(isSdkIgnored('internal/vendor/x.go', ['internal/**'])).toBe(true);
    // directory + its contents
    expect(isSdkIgnored('docs', ['docs/'])).toBe(true);
    expect(isSdkIgnored('docs/api/x.md', ['docs/'])).toBe(true);
    // negation (last match wins)
    expect(isSdkIgnored('README.md', ['*.md', '!README.md'])).toBe(false);
    expect(isSdkIgnored('other.md', ['*.md', '!README.md'])).toBe(true);
  });
});

describe('materializeProject: disk-less file map + manifest', () => {
  const sha256 = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

  it('returns the file map plus a deterministic .sdk/sdk.lock whose hashes match the emitted bytes', async () => {
    const out = await materializeProject({ 'pkg/client.go': 'client', 'types.go': 'types' });

    // Generated files pass through verbatim; the framework owns the manifest.
    expect(out['pkg/client.go']).toBe('client');
    expect(out['types.go']).toBe('types');

    const m = JSON.parse(out[SDK_LOCK_FILENAME]);
    expect(m.schemaVersion).toBe(1);
    expect(m.generator).toBe('opensdk');
    expect(Object.keys(m.files)).toEqual(['pkg/client.go', 'types.go']); // sorted
    expect(m.files['types.go']).toBe(sha256('types')); // hash of the EMITTED content
    expect(out[SDK_LOCK_FILENAME]).not.toMatch(/\d{4}-\d{2}-\d{2}T/); // no timestamps
  });

  it('records the generator name from options', async () => {
    const out = await materializeProject({ 'a.go': 'a' }, { generator: 'go' });
    expect(JSON.parse(out[SDK_LOCK_FILENAME]).generator).toBe('go');
  });

  it('canonicalizes mergeJson (no disk → pretty JSON + newline, the exact bytes a later writeProject regen would hash)', async () => {
    const out = await materializeProject({
      'pkg.json': { content: '{"a":1,"b":[1,2]}', writeMode: 'mergeJson' },
    });
    const canonical = `${JSON.stringify({ a: 1, b: [1, 2] }, null, 2)}\n`;
    expect(out['pkg.json']).toBe(canonical);
    expect(JSON.parse(out[SDK_LOCK_FILENAME]).files['pkg.json']).toBe(sha256(canonical));
  });

  it('rejects a file map that emits the manifest path itself', async () => {
    await expect(materializeProject({ [SDK_LOCK_FILENAME]: '{}' })).rejects.toThrow(/owns it/);
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
