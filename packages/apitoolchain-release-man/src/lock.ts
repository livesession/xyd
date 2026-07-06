import { createHash } from "node:crypto";
import type { ReleaseConfig } from "./types";

/** Timestamp-free ownership lock: sha256 of every generated file, sorted. */
export interface ReleaseLock {
  schemaVersion: 1;
  generator: string;
  version: string;
  files: Record<string, string>;
}

function sha256(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

/**
 * Build the ownership lock (the gen.lock analog): a sorted, timestamp-free map
 * of repo-relative path → sha256, so a no-op re-run is byte-identical and stale
 * files can be pruned safely.
 */
export function buildReleaseLock(
  files: Record<string, string>,
  meta: { generator: string; version: string },
): ReleaseLock {
  const sorted: Record<string, string> = {};
  for (const path of Object.keys(files).sort())
    sorted[path] = sha256(files[path]);
  return {
    schemaVersion: 1,
    generator: meta.generator,
    version: meta.version,
    files: sorted,
  };
}

/** Render just the lock as pretty JSON (for a standalone lock file). */
export function renderReleaseLock(
  files: Record<string, string>,
  meta: { generator: string; version: string },
): string {
  return `${JSON.stringify(buildReleaseLock(files, meta), null, 2)}\n`;
}

/**
 * Render the combined `.apitoolchain/release.json` manifest: the release config
 * the repo was generated with + the ownership lock. Deterministic.
 */
export function renderReleaseManifest(i: {
  config: ReleaseConfig;
  files: Record<string, string>;
  generator: string;
  version: string;
}): string {
  const manifest = {
    config: i.config,
    lock: buildReleaseLock(i.files, {
      generator: i.generator,
      version: i.version,
    }),
  };
  return `${JSON.stringify(manifest, null, 2)}\n`;
}
