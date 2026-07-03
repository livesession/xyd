import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import * as path from 'node:path';

import { mergePublishTargets } from '@xyd-js/opensdk-core';
import type { PublishTarget } from '@xyd-js/opensdk-core';
import { resolveLanguage } from '@xyd-js/opensdk-framework';

import type { ResolvedConfig } from './config/types';

/**
 * `opensdk publish` — package + publish already-generated SDKs to their language
 * registries. Identity (author/license/...) is baked into the manifests at
 * generate time; this command only carries the REGISTRY MECHANICS (registry URL
 * + auth token from `tokenEnv`) and drives each language's native pack/push.
 *
 * The per-language pack/push lives in `publishTarget()` (exported) so the publish
 * e2e can drive the exact same mechanism against a local registry.
 */

/** One glob-ish lookup: first file in `dir` matching `re`, or null. */
function firstFile(dir: string, re: RegExp): string | null {
  if (!fs.existsSync(dir)) return null;
  const hit = fs.readdirSync(dir).find((f) => re.test(f));
  return hit ? path.join(dir, hit) : null;
}

/** Run a child synchronously with cwd + inherited stdio; throw on non-zero. */
function run(cmd: string, args: string[], opts: { cwd: string; env?: NodeJS.ProcessEnv }): void {
  const res = spawnSync(cmd, args, { cwd: opts.cwd, stdio: 'inherit', env: opts.env ?? process.env });
  if (res.error) throw new Error(`${cmd} failed to start: ${res.error.message}`);
  if (res.status !== 0) throw new Error(`${cmd} ${args.join(' ')} exited with ${res.status ?? 'signal'}`);
}

export interface PublishTargetRun {
  /** Registry URL (npm registry / PyPI repository-url / NuGet source / Maven repo file://...). */
  registry?: string;
  /** Resolved auth token (from `tokenEnv`), or undefined for an unauthenticated/local registry. */
  token?: string;
  /** Version for registries with no manifest version (Go git tag). Falls back to `0.0.0`. */
  version?: string;
  /** Pack only — never push to the registry. */
  dryRun?: boolean;
}

/**
 * Package + publish ONE already-generated SDK at `dir` for `lang`. Dispatches to
 * the language's native tooling; on `dryRun` it packs (or prints) without pushing.
 */
export function publishTarget(lang: string, dir: string, run_: PublishTargetRun): void {
  const canonical = resolveLanguage(lang);
  if (!fs.existsSync(dir)) {
    throw new Error(`No generated SDK at ${dir}. Run \`opensdk generate\` first (or pass --spec to regenerate).`);
  }
  const publishers: Record<string, () => void> = {
    node: () => publishNode(dir, run_),
    python: () => publishPython(dir, run_),
    ruby: () => publishRuby(dir, run_),
    dotnet: () => publishDotnet(dir, run_),
    java: () => publishJava(dir, run_),
    go: () => publishGo(dir, run_),
  };
  const publisher = publishers[canonical];
  if (!publisher) throw new Error(`No publisher for language "${canonical}".`);
  publisher();
}

// ── npm ────────────────────────────────────────────────────────────────────
function publishNode(dir: string, r: PublishTargetRun): void {
  const registry = r.registry ?? 'https://registry.npmjs.org';
  const args = ['publish', '--registry', registry];
  if (r.dryRun) args.push('--dry-run');
  // Auth via a throwaway userconfig so the token never lands in the package dir.
  let userconfig: string | undefined;
  try {
    if (r.token && !r.dryRun) {
      const host = registry.replace(/^https?:/, '');
      userconfig = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'opensdk-npmrc-')), '.npmrc');
      fs.writeFileSync(userconfig, `${host.replace(/\/$/, '')}/:_authToken=${r.token}\n`);
      args.push('--userconfig', userconfig);
    }
    run('npm', args, { cwd: dir });
  } finally {
    if (userconfig) fs.rmSync(path.dirname(userconfig), { recursive: true, force: true });
  }
}

// ── PyPI ───────────────────────────────────────────────────────────────────
function publishPython(dir: string, r: PublishTargetRun): void {
  run('python3', ['-m', 'build'], { cwd: dir });
  if (r.dryRun) return;
  const args = ['upload'];
  if (r.registry) args.push('--repository-url', r.registry);
  args.push('dist/*');
  run('twine', args, {
    cwd: dir,
    env: { ...process.env, TWINE_USERNAME: process.env.TWINE_USERNAME ?? '__token__', TWINE_PASSWORD: r.token ?? '' },
  });
}

// ── RubyGems ─────────────────────────────────────────────────────────────────
function publishRuby(dir: string, r: PublishTargetRun): void {
  const gemspec = firstFile(dir, /\.gemspec$/);
  if (!gemspec) throw new Error(`No .gemspec in ${dir}.`);
  run('gem', ['build', path.basename(gemspec)], { cwd: dir });
  if (r.dryRun) return;
  const gem = firstFile(dir, /\.gem$/);
  if (!gem) throw new Error(`gem build produced no .gem in ${dir}.`);
  const args = ['push'];
  if (r.registry) args.push('--host', r.registry);
  args.push(path.basename(gem));
  run('gem', args, { cwd: dir, env: { ...process.env, ...(r.token ? { GEM_HOST_API_KEY: r.token } : {}) } });
}

// ── NuGet ────────────────────────────────────────────────────────────────────
function publishDotnet(dir: string, r: PublishTargetRun): void {
  run('dotnet', ['pack', '-c', 'Release'], { cwd: dir });
  if (r.dryRun) return;
  const nupkg = firstFile(path.join(dir, 'bin', 'Release'), /\.nupkg$/);
  if (!nupkg) throw new Error(`dotnet pack produced no .nupkg under ${dir}/bin/Release.`);
  const args = ['nuget', 'push', nupkg, '-s', r.registry ?? 'https://api.nuget.org/v3/index.json'];
  if (r.token) args.push('-k', r.token);
  run('dotnet', args, { cwd: dir });
}

// ── Maven ────────────────────────────────────────────────────────────────────
function publishJava(dir: string, r: PublishTargetRun): void {
  if (r.dryRun) {
    run('mvn', ['-q', '-DskipTests', 'package'], { cwd: dir });
    return;
  }
  const args = ['-q', '-DskipTests', 'deploy'];
  // A registry URL routes deploy to that repository; a bare `mvn deploy` needs
  // <distributionManagement> in the pom (real Central release flow).
  if (r.registry) args.push(`-DaltDeploymentRepository=opensdk::default::${r.registry}`);
  run('mvn', args, { cwd: dir });
}

// ── Go (git tag) ─────────────────────────────────────────────────────────────
function publishGo(dir: string, r: PublishTargetRun): void {
  const version = r.version ?? '0.0.0';
  const tag = version.startsWith('v') ? version : `v${version}`;
  if (r.dryRun) {
    console.log(`[dry-run] would tag ${tag} in ${dir}`);
    return;
  }
  run('git', ['tag', tag], { cwd: dir });
  // Push only when the module has a remote configured (a local git repo won't).
  const hasRemote = spawnSync('git', ['remote'], { cwd: dir, stdio: 'pipe' }).stdout?.toString().trim();
  if (hasRemote) run('git', ['push', '--tags'], { cwd: dir });
  else console.log(`Tagged ${tag}. No git remote configured — push it to publish the module.`);
}

export interface PublishCommandOptions {
  /** Single language/alias; omit to publish every declared language. */
  lang?: string;
  /** Output dir (single --lang) or base dir for per-language subfolders (multi). */
  output: string;
  /** Registry override (wins over config `publish.registry`). */
  registry?: string;
  /** Pack only — don't push. */
  dryRun?: boolean;
  /** Resolved config (per-language output dirs + publish targets). */
  config: ResolvedConfig | null;
}

/** Resolve token from a publish target's `tokenEnv` (env only; never stored). */
function resolveToken(publish: PublishTarget | undefined): string | undefined {
  if (!publish?.tokenEnv) return undefined;
  const token = process.env[publish.tokenEnv];
  if (!token) console.warn(`Warning: publish.tokenEnv "${publish.tokenEnv}" is not set in the environment.`);
  return token;
}

/** `opensdk publish` — publish one or every declared language's generated SDK. */
export async function publishCommand(opts: PublishCommandOptions): Promise<void> {
  const { config } = opts;
  const langs = opts.lang
    ? [resolveLanguage(opts.lang)]
    : Object.keys(config?.emitterOptions ?? config?.targets ?? {});
  if (!langs.length) {
    throw new Error('No languages to publish. Pass --lang, or declare language sections in sdk.json.');
  }
  for (const lang of langs) {
    const target = config?.targets?.[lang];
    const publish = mergePublishTargets(config?.publish, target?.publish);
    const dir = opts.lang ? opts.output : (target?.output ?? path.join(opts.output, lang));
    console.log(`Publishing ${lang} from ${dir}${opts.dryRun ? ' (dry-run)' : ''}...`);
    publishTarget(lang, dir, {
      registry: opts.registry ?? publish?.registry,
      token: resolveToken(publish),
      version: publish?.version,
      dryRun: opts.dryRun,
    });
  }
}
