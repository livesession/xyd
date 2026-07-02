import type { GeneratedFileEntry, ProjectFileMap, WriteMode } from './types';

/**
 * The regen manifest writeProject leaves next to every generated SDK. It
 * records what THIS generator owns (rel path -> sha256 of the pristine
 * generated content) so the next run can prune stale files safely: a file the
 * emitter no longer produces is deleted only while its on-disk bytes still
 * hash to the manifest entry — locally-modified orphans are kept and surfaced
 * as warnings. Deliberately timestamp-free so a no-change regen is git-diff
 * clean.
 */
export const MANIFEST_FILENAME = '.opensdk.manifest.json';

const MANIFEST_SCHEMA_VERSION = 1;

export interface ProjectManifest {
  /** Manifest schema version. Bump when the format changes incompatibly. */
  schemaVersion: number;
  /** Generator provenance (e.g. 'opensdk' or an emitter language). */
  generator: string;
  /** Sorted rel path -> sha256 hex of the pristine generated content. */
  files: Record<string, string>;
}

export interface WriteProjectOptions {
  /** Generator name recorded in the manifest. Default: 'opensdk'. */
  generator?: string;
}

/** Per-run summary of what writeProject did (rel paths, sorted by processing order). */
export interface WriteProjectResult {
  /** Files created or rewritten this run. */
  written: string[];
  /** Files deliberately left alone: existing 'skipIfExists' scaffold + unparseable 'mergeJson' targets. */
  skipped: string[];
  /** Files whose on-disk bytes already matched the target — not rewritten, mtimes stay stable. */
  unchanged: string[];
  /** Stale generated files deleted (previous-manifest entries whose on-disk hash was still pristine). */
  pruned: string[];
  /** Stale but locally-modified orphans KEPT on disk — the caller's warning list. */
  keptModified: string[];
}

/**
 * Write a generated file map to disk (the only fs-touching entry point) with
 * the full regen lifecycle:
 *
 *  1. per-file write semantics — plain strings / 'overwrite' entries replace,
 *     'skipIfExists' never clobbers an existing file, 'mergeJson' deep-merges
 *     the generated JSON INTO the existing file's JSON (existing user keys
 *     win; arrays replace as a unit);
 *  2. identical-content no-op — a file whose on-disk bytes already match is
 *     not rewritten, so mtimes (and incremental build tools) stay stable;
 *  3. guarded stale-prune — files recorded by the previous manifest but absent
 *     from this run's file map are deleted only while their on-disk hash still
 *     matches the manifest (pristine generated output); locally-modified
 *     orphans are kept and returned in `keptModified`. First adoption (no
 *     previous manifest) never prunes — it just writes the baseline;
 *  4. manifest — '.opensdk.manifest.json' records this run's ownership set.
 *
 * Backward-compatible: the historical `Record<path, contents>` input still
 * works and existing callers may ignore the returned summary.
 */
export async function writeProject(
  files: ProjectFileMap,
  outDir: string,
  options: WriteProjectOptions = {},
): Promise<WriteProjectResult> {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const { createHash } = await import('node:crypto');

  const sha256 = (content: string) => createHash('sha256').update(content, 'utf8').digest('hex');
  const readIfExists = async (full: string): Promise<string | null> => {
    try {
      return await fs.readFile(full, 'utf8');
    } catch {
      return null;
    }
  };

  const result: WriteProjectResult = { written: [], skipped: [], unchanged: [], pruned: [], keptModified: [] };
  /** rel path -> sha256 of the PRISTINE generated content (the prune guard's "safe to delete" fingerprint). */
  const manifestFiles: Record<string, string> = {};
  const previous = readManifest(await readIfExists(path.join(outDir, MANIFEST_FILENAME)));

  // Sorted for deterministic write order (and a deterministic result/manifest).
  const entries = Object.entries(files)
    .map(([rel, value]) => [rel, typeof value === 'string' ? { content: value } : value] as [string, GeneratedFileEntry])
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  for (const [rel, entry] of entries) {
    if (rel === MANIFEST_FILENAME) {
      throw new Error(`writeProject: the file map may not emit ${MANIFEST_FILENAME} (writeProject owns it)`);
    }
    const full = path.join(outDir, rel);
    const mode: WriteMode = entry.writeMode ?? 'overwrite';
    const existing = await readIfExists(full);

    let target = entry.content;
    let pristineHash = sha256(entry.content);

    if (mode === 'skipIfExists' && existing !== null) {
      // User-owned scaffold: hash the generated CANDIDATE, not the user's file,
      // so a customized scaffold never matches the prune guard and is kept.
      result.skipped.push(rel);
      manifestFiles[rel] = pristineHash;
      continue;
    }

    if (mode === 'mergeJson') {
      // Emitter bug if the generated content isn't JSON — fail loud.
      const generated: unknown = JSON.parse(entry.content);
      const canonical = `${JSON.stringify(generated, null, 2)}\n`;
      target = canonical;
      // Only a merge result byte-identical to the pristine generated output
      // (no surviving user keys) may ever be pruned.
      pristineHash = sha256(canonical);
      if (existing !== null) {
        let existingJson: unknown;
        try {
          existingJson = JSON.parse(existing);
        } catch {
          // Unparseable user JSON: never clobber it — leave the file alone.
          result.skipped.push(rel);
          manifestFiles[rel] = pristineHash;
          continue;
        }
        target = `${JSON.stringify(deepMergeJson(generated, existingJson), null, 2)}\n`;
      }
    }

    manifestFiles[rel] = pristineHash;
    if (existing === target) {
      result.unchanged.push(rel);
      continue;
    }
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, target, 'utf8');
    result.written.push(rel);
  }

  // Guarded stale-prune — only with a previous manifest (first adoption never deletes).
  if (previous) {
    const stale = Object.keys(previous.files)
      .filter((rel) => !(rel in files) && rel !== MANIFEST_FILENAME)
      .sort();
    for (const rel of stale) {
      const full = path.join(outDir, rel);
      const onDisk = await readIfExists(full);
      if (onDisk === null) continue; // already gone
      if (sha256(onDisk) !== previous.files[rel]) {
        result.keptModified.push(rel); // locally modified — keep, warn
        continue;
      }
      try {
        await fs.unlink(full);
      } catch {
        continue; // racing deletion / permissions — keep going
      }
      result.pruned.push(rel);
      await removeEmptyParents(path.dirname(full), outDir);
    }
  }

  // Manifest last, sorted + timestamp-free (identical-content no-op applies to it too).
  const manifest: ProjectManifest = {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    generator: options.generator ?? 'opensdk',
    files: Object.fromEntries(Object.entries(manifestFiles).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))),
  };
  const manifestContent = `${JSON.stringify(manifest, null, 2)}\n`;
  const manifestFull = path.join(outDir, MANIFEST_FILENAME);
  if ((await readIfExists(manifestFull)) !== manifestContent) {
    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(manifestFull, manifestContent, 'utf8');
  }

  return result;
}

/** Parse + validate a previous manifest. Absent, malformed or newer-schema manifests are ignored (no prune). */
function readManifest(raw: string | null): ProjectManifest | null {
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ProjectManifest>;
    if (
      typeof parsed.schemaVersion !== 'number' ||
      typeof parsed.generator !== 'string' ||
      typeof parsed.files !== 'object' ||
      parsed.files === null ||
      Array.isArray(parsed.files) ||
      !Object.values(parsed.files).every((h) => typeof h === 'string')
    ) {
      return null;
    }
    if (parsed.schemaVersion > MANIFEST_SCHEMA_VERSION) return null;
    return parsed as ProjectManifest;
  } catch {
    return null;
  }
}

/**
 * Deep-merge the generated JSON INTO the existing file's JSON:
 * - both plain objects: recurse per key; keys only one side has are kept;
 * - any conflict of non-object values (primitives, arrays, null): the EXISTING
 *   user value wins, and arrays replace as a unit (never element-merged).
 */
export function deepMergeJson(generated: unknown, existing: unknown): unknown {
  if (isPlainObject(generated) && isPlainObject(existing)) {
    const merged: Record<string, unknown> = { ...generated };
    for (const [key, value] of Object.entries(existing)) {
      merged[key] = key in merged ? deepMergeJson(merged[key], value) : value;
    }
    return merged;
  }
  return existing;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Walk up from `startDir` removing now-empty directories until hitting
 * `stopDir` (exclusive) or a non-empty directory. Errors are ignored.
 */
async function removeEmptyParents(startDir: string, stopDir: string): Promise<void> {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  let current = path.resolve(startDir);
  const stop = path.resolve(stopDir);
  while (current.startsWith(stop + path.sep) && current !== stop) {
    let names: string[];
    try {
      names = await fs.readdir(current);
    } catch {
      return;
    }
    if (names.length > 0) return;
    try {
      await fs.rmdir(current);
    } catch {
      return;
    }
    current = path.dirname(current);
  }
}
