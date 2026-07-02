import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { expect } from 'vitest';

import { hasCommand, listFiles, writeTree } from '@xyd-js/opensdk-ci';

import { opensdkDotnet } from '../index';
import type { OpensdkDotnetOptions } from '../index';

// REGEN=1 regenerates the golden output/ trees instead of asserting.
const REGENERATE = process.env.REGEN === '1';

// O2S_DOTNET_SMOKE=1 (and a .NET SDK) enables the `dotnet build` smoke. dotnet
// is not installed in this environment, so the smoke skips cleanly by default.
export const DOTNET_SMOKE = process.env.O2S_DOTNET_SMOKE === '1' && hasCommand('dotnet --version');

function fixturePath(name: string): string {
  return path.join(__dirname, '../__fixtures__', name);
}

function readIR(name: string) {
  return JSON.parse(fs.readFileSync(path.join(fixturePath(name), 'input.json'), 'utf8'));
}

/** Golden test: opensdkDotnet(input.json) === the committed output/ file tree. */
export function testFixture(name: string, options?: OpensdkDotnetOptions) {
  const files = opensdkDotnet(readIR(name), options);
  const outDir = path.join(fixturePath(name), 'output');

  if (REGENERATE) writeTree(outDir, files);

  const expected = listFiles(outDir);
  expect(Object.keys(files).sort()).toEqual(Object.keys(expected).sort());
  for (const [rel, content] of Object.entries(files)) {
    expect(content, `mismatch in ${name}/${rel}`).toEqual(expected[rel]);
  }
}

/**
 * Optional: write the project to a temp dir and `dotnet build` EACH generated
 * `.csproj` — the SDK library and the emitted test project (whose ProjectReference
 * re-checks the library). Gated on O2S_DOTNET_SMOKE=1 + a .NET SDK on PATH; skips
 * cleanly when dotnet is absent. Generate-only otherwise (dotnet is not installed
 * in this environment), so the C# is verified structurally by the goldens.
 */
export function dotnetBuildSmoke(name: string, options?: OpensdkDotnetOptions) {
  const files = opensdkDotnet(readIR(name), options);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `o2s-dotnet-${name.replace(/\W/g, '')}-`));
  try {
    writeTree(dir, files);
    const projects = Object.keys(files).filter((p) => p.endsWith('.csproj'));
    for (const project of projects) {
      execSync(`dotnet build --nologo ${JSON.stringify(project)}`, { cwd: dir, stdio: 'pipe' });
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
