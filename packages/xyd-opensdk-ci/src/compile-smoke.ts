import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import * as path from 'node:path';

import { resolveLanguage, runCommand } from '@xyd-js/opensdk-framework';

import { hasCommand } from './golden';

// Emitter-agnostic compile smoke: does a generated SDK at `dir` COMPILE for the
// given language? Mirrors what each emitter package's __tests__/utils.ts smoke
// does, but in one place so a cross-language test (the chain e2e) can assert every
// target compiles without importing per-emitter test utils. Gated on the toolchain
// being installed (absent → skipped).

const PROBES: Record<string, string> = {
  node: 'node --version',
  go: 'go version',
  python: 'python3 --version',
  ruby: 'ruby --version',
  java: 'javac -version',
  dotnet: 'dotnet --version',
};

/** Recursively list files under `dir` whose name ends with `ext`. */
function filesByExt(dir: string, ext: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesByExt(p, ext));
    else if (entry.name.endsWith(ext)) out.push(p);
  }
  return out;
}

const COMPILERS: Record<string, (dir: string) => void> = {
  node(dir) {
    const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc');
    const args = ['--noEmit'];
    if (fs.existsSync(path.join(dir, 'tsconfig.json'))) args.push('-p', 'tsconfig.json');
    else args.push(...filesByExt(path.join(dir, 'src'), '.ts'));
    runCommand('node', [tsc, ...args], { cwd: dir });
  },
  go(dir) {
    runCommand('go', ['mod', 'tidy'], { cwd: dir, env: { ...process.env, CGO_ENABLED: '0', GOFLAGS: '-mod=mod' } });
    runCommand('go', ['build', './...'], { cwd: dir, env: { ...process.env, CGO_ENABLED: '0' } });
  },
  python(dir) {
    runCommand('python3', ['-m', 'compileall', '-q', '.'], { cwd: dir });
  },
  ruby(dir) {
    for (const f of filesByExt(dir, '.rb')) runCommand('ruby', ['-c', f], { cwd: dir });
  },
  java(dir) {
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'o2s-javac-'));
    try {
      runCommand('javac', ['-d', out, ...filesByExt(dir, '.java')], { cwd: dir });
    } finally {
      fs.rmSync(out, { recursive: true, force: true });
    }
  },
  dotnet(dir) {
    for (const csproj of filesByExt(dir, '.csproj')) runCommand('dotnet', ['build', '--nologo', csproj], { cwd: dir });
  },
};

/**
 * Compile the generated SDK at `dir` for `lang`. Returns `false` (skipped) when the
 * toolchain isn't installed; throws when the SDK fails to compile.
 */
export function compileSmoke(lang: string, dir: string): boolean {
  const canonical = resolveLanguage(lang);
  const probe = PROBES[canonical];
  if (!probe || !hasCommand(probe)) return false;
  const compile = COMPILERS[canonical];
  if (!compile) throw new Error(`No compile smoke for language "${canonical}".`);
  compile(dir);
  return true;
}
