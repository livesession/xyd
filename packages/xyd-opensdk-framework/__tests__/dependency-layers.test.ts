import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

// Enforced dependency layers for the opensdk pipeline (oagen-style):
//
//   Layer 0: opensdk-core        <- imports NO opensdk package
//   Layer 1: opensdk-framework   <- core only
//   Layer 1: openapi2opensdk     <- core only (the converter never sees emitters)
//   Layer 2: opensdk-{go,python,node,ruby,java,dotnet}  <- core + framework only (emitter PLUGINS)
//   Layer 2: opensdk-ci          <- core + framework only (test harness)
//   Layer 3: opensdk-cli         <- everything except ci (top-level entrypoint)
//
// One-way imports only; emitters never import each other, the converter, or ci.

const PACKAGES = path.join(__dirname, '../..');

const ALLOWED: Record<string, string[]> = {
  'xyd-opensdk-core': [],
  'xyd-opensdk-framework': ['@xyd-js/opensdk-core'],
  'xyd-openapi2opensdk': ['@xyd-js/opensdk-core'],
  'xyd-opensdk-go': ['@xyd-js/opensdk-core', '@xyd-js/opensdk-framework'],
  'xyd-opensdk-python': ['@xyd-js/opensdk-core', '@xyd-js/opensdk-framework'],
  'xyd-opensdk-node': ['@xyd-js/opensdk-core', '@xyd-js/opensdk-framework'],
  'xyd-opensdk-ruby': ['@xyd-js/opensdk-core', '@xyd-js/opensdk-framework'],
  'xyd-opensdk-java': ['@xyd-js/opensdk-core', '@xyd-js/opensdk-framework'],
  'xyd-opensdk-dotnet': ['@xyd-js/opensdk-core', '@xyd-js/opensdk-framework'],
  'xyd-opensdk-ci': ['@xyd-js/opensdk-core', '@xyd-js/opensdk-framework'],
  'xyd-opensdk-cli': [
    '@xyd-js/opensdk-core',
    '@xyd-js/opensdk-framework',
    '@xyd-js/openapi2opensdk',
    '@xyd-js/opensdk-go',
    '@xyd-js/opensdk-python',
    '@xyd-js/opensdk-node',
    '@xyd-js/opensdk-ruby',
    '@xyd-js/opensdk-java',
    '@xyd-js/opensdk-dotnet',
  ],
};

// Every pipeline package name an src/ file could illegally import.
const PIPELINE_PACKAGES = [
  '@xyd-js/opensdk-core',
  '@xyd-js/opensdk-framework',
  '@xyd-js/openapi2opensdk',
  '@xyd-js/opensdk-go',
  '@xyd-js/opensdk-python',
  '@xyd-js/opensdk-node',
  '@xyd-js/opensdk-ruby',
  '@xyd-js/opensdk-java',
  '@xyd-js/opensdk-dotnet',
  '@xyd-js/opensdk-ci',
  '@xyd-js/opensdk-cli',
];

function srcFiles(pkg: string): string[] {
  const dir = path.join(PACKAGES, pkg, 'src');
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  const walk = (d: string) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.ts')) out.push(full);
    }
  };
  walk(dir);
  return out;
}

function pipelineImports(file: string): string[] {
  const src = fs.readFileSync(file, 'utf8');
  const imports = [...src.matchAll(/from\s+['"](@xyd-js\/[\w-]+)['"]/g)].map((m) => m[1]);
  return imports.filter((i) => PIPELINE_PACKAGES.includes(i));
}

describe('opensdk dependency layers (one-way imports only)', () => {
  for (const [pkg, allowed] of Object.entries(ALLOWED)) {
    it(`${pkg} src imports only [${allowed.join(', ') || 'nothing'}]`, () => {
      const violations: string[] = [];
      for (const file of srcFiles(pkg)) {
        for (const imp of pipelineImports(file)) {
          if (!allowed.includes(imp)) {
            violations.push(`${path.relative(PACKAGES, file)} -> ${imp}`);
          }
        }
      }
      expect(violations, violations.join('\n')).toEqual([]);
    });
  }
});
