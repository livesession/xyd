import fs from 'node:fs';
import os from 'node:os';
import * as path from 'node:path';

import type { Method, NamedType, OpensdkSpecJson } from '@xyd-js/opensdk-core';
import type { Emitter, EmitterContext } from '@xyd-js/opensdk-framework';
import { generate, resolveLanguage } from '@xyd-js/opensdk-framework';

import { compileSmoke } from './compile-smoke';

function safeName(pkgJson: string | undefined): string | undefined {
  if (!pkgJson) return undefined;
  try {
    return (JSON.parse(pkgJson) as { name?: string }).name;
  } catch {
    return undefined;
  }
}

/**
 * Drop the usage snippet into the generated project as a BUILDABLE entry, where the
 * language's compile smoke will pick it up:
 *   go     → example/main.go        (`package main`, built by `go build ./...`)
 *   node   → src/example.ts         (+ a tsconfig `paths` map so the pkg-name import resolves)
 *   python → example.py             (compileall = syntax check; import need not resolve)
 *   ruby   → example.rb             (`ruby -c` = syntax check)
 *   java   → Example.java           (same package as the SDK → javac compiles them together)
 *   dotnet → Usage.cs               (picked up by the .csproj)
 */
export function placeSnippet(canonical: string, files: Record<string, string>, snippet: string): void {
  switch (canonical) {
    case 'go':
      files['example/main.go'] = snippet;
      return;
    case 'node': {
      const pkgName = safeName(files['package.json']);
      const tsconfig = JSON.parse(files['tsconfig.json'] ?? '{}') as {
        compilerOptions?: Record<string, unknown>;
      };
      tsconfig.compilerOptions = tsconfig.compilerOptions ?? {};
      tsconfig.compilerOptions.baseUrl = '.';
      if (pkgName) {
        tsconfig.compilerOptions.paths = { [pkgName]: ['./src/index.ts'], [`${pkgName}/*`]: ['./src/*'] };
      }
      files['tsconfig.json'] = `${JSON.stringify(tsconfig, null, 2)}\n`;
      // The SDK declares `process` file-locally; the example needs its own ambient
      // shim (the generated tsconfig has no @types/node — DOM lib only).
      files['src/_usage_shims.d.ts'] = 'declare const process: { env: Record<string, string | undefined> };\n';
      files['src/example.ts'] = snippet;
      return;
    }
    case 'python':
      files['example.py'] = snippet;
      return;
    case 'ruby':
      files['example.rb'] = snippet;
      return;
    case 'java':
      files['Example.java'] = snippet;
      return;
    case 'dotnet':
      files['Usage.cs'] = snippet;
      return;
    default:
      throw new Error(`No usage-snippet placement for language "${canonical}".`);
  }
}

/**
 * Does the generated USAGE snippet for `method` COMPILE against a freshly-generated
 * SDK? Generates the whole SDK for `ir`, drops the snippet in as a buildable entry,
 * and runs the language's compile smoke. Returns `false` (skipped) when the snippet
 * is empty or the toolchain is absent; THROWS when it fails to compile.
 *
 * Pass the emitter's own `language` (`emitter.language`) as `lang`.
 */
export function compileUsageSnippet(
  lang: string,
  ir: OpensdkSpecJson,
  method: Method,
  chain: string[],
  emitter: Emitter,
  opts: Record<string, unknown> = {},
): boolean {
  const canonical = resolveLanguage(lang);
  const types = new Map<string, NamedType>((ir.types ?? []).map((t) => [t.name, t]));
  const ctx: EmitterContext = { spec: ir, types, emitterOptions: opts };
  const snippet = emitter.generateUsage?.(method, chain, ctx);
  if (!snippet) return false;

  const files: Record<string, string> = { ...generate(ir, emitter, opts) };
  placeSnippet(canonical, files, snippet);

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `o2s-usage-${canonical}-`));
  try {
    for (const [rel, content] of Object.entries(files)) {
      const target = path.join(dir, rel);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content);
    }
    return compileSmoke(canonical, dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
