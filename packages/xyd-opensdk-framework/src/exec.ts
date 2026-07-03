import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import * as path from 'node:path';

// Shared publish plumbing. Emitters are otherwise PURE (their generate* methods
// return GeneratedFile[]); publishing is a separate impure step, so it lives as a
// standalone `publish<Lang>(dir, opts)` per emitter package rather than a method
// on the Emitter contract. These helpers + the options type are the shared bits
// both the `opensdk publish` command and the publish e2e drive.

/** Options every emitter's `publish<Lang>(dir, opts)` accepts. */
export interface EmitterPublishOptions {
  /** Registry URL, or a folder/file feed path (npm registry / PyPI repository-url / NuGet source / Maven repo). */
  registry?: string;
  /** Auth token (resolved from the config's `tokenEnv` by the caller); undefined for an anonymous/local registry. */
  token?: string;
  /** Version for registries with no manifest version (the Go git tag). Falls back to `0.0.0`. */
  version?: string;
  /** Dist-tag for registries that support one (npm). Omit to publish to the default tag (`latest`). */
  tag?: string;
  /** Package only (pack/build), never push. */
  dryRun?: boolean;
}

/** Run a child synchronously (cwd + inherited stdio). Throws on non-zero unless `tolerant`. Returns the exit status. */
export function runCommand(
  cmd: string,
  args: string[],
  opts: { cwd: string; env?: NodeJS.ProcessEnv; tolerant?: boolean },
): number {
  const res = spawnSync(cmd, args, { cwd: opts.cwd, stdio: 'inherit', env: opts.env ?? process.env });
  if (res.error) throw new Error(`${cmd} failed to start: ${res.error.message}`);
  const status = res.status ?? 1;
  if (status !== 0 && !opts.tolerant) {
    throw new Error(`${cmd} ${args.join(' ')} exited with ${res.status ?? 'signal'} (cwd ${opts.cwd})`);
  }
  return status;
}

/** Capture a child's stdout (never throws); `''` on failure. */
export function commandOutput(cmd: string, args: string[], opts: { cwd: string }): string {
  const res = spawnSync(cmd, args, { cwd: opts.cwd, stdio: ['ignore', 'pipe', 'ignore'] });
  return res.stdout?.toString() ?? '';
}

/** First file in `dir` matching `re`, or null. */
export function firstFile(dir: string, re: RegExp): string | null {
  if (!fs.existsSync(dir)) return null;
  const hit = fs.readdirSync(dir).find((f) => re.test(f));
  return hit ? path.join(dir, hit) : null;
}
