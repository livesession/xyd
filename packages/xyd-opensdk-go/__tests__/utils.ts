import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { expect } from 'vitest';

import { hasCommand, listFiles, writeTree } from '@xyd-js/opensdk-ci';

import { opensdkGo } from '../index';
import type { OpensdkGoOptions } from '../index';

// REGEN=1 regenerates the golden output/ trees instead of asserting.
const REGENERATE = process.env.REGEN === '1';

// O2S_GO_SMOKE=1 (and a Go toolchain) enables the go build/vet smoke.
export const GO_SMOKE = process.env.O2S_GO_SMOKE === '1' && hasCommand('go version');

function fixturePath(name: string): string {
  return path.join(__dirname, '../__fixtures__', name);
}

function readIR(name: string) {
  return JSON.parse(fs.readFileSync(path.join(fixturePath(name), 'input.json'), 'utf8'));
}

/** Golden test: opensdkGo(input.json) === the committed output/ file tree. */
export function testFixture(name: string, options?: OpensdkGoOptions) {
  const files = opensdkGo(readIR(name), options);
  const outDir = path.join(fixturePath(name), 'output');

  if (REGENERATE) writeTree(outDir, files);

  const expected = listFiles(outDir);
  expect(Object.keys(files).sort()).toEqual(Object.keys(expected).sort());
  for (const [rel, content] of Object.entries(files)) {
    expect(content, `mismatch in ${name}/${rel}`).toEqual(expected[rel]);
  }
}

/**
 * Optional: write the project to a temp dir and run `go mod tidy && go build && go vet`.
 * When `runtimeTest` names a Go test file it is copied next to client.go and
 * `go test ./...` runs too — a REAL runtime check of the vendored runtime
 * (retry loop, multipart/form encoders, User-Agent, APIError), not just compile.
 * CGO is disabled for the test run: the pure-Go resolver keeps it hermetic and
 * dodges a macOS stall where a freshly-built cgo test binary that opens a
 * localhost listener wedges at exec (uninterruptible, pre-main).
 */
export function goBuildSmoke(name: string, options?: OpensdkGoOptions, runtimeTest?: string) {
  const files = opensdkGo(readIR(name), options);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `o2s-${name.replace(/\W/g, '')}-`));
  try {
    writeTree(dir, files);
    if (runtimeTest) fs.copyFileSync(runtimeTest, path.join(dir, 'sdk_smoke_test.go'));
    execSync('go mod tidy', { cwd: dir, stdio: 'pipe' });
    execSync('go build ./...', { cwd: dir, stdio: 'pipe' });
    execSync('go vet ./...', { cwd: dir, stdio: 'pipe' });
    if (runtimeTest) {
      execSync('go test -timeout 120s -count=1 ./...', {
        cwd: dir,
        stdio: 'pipe',
        env: {
          ...process.env,
          CGO_ENABLED: '0',
          GODEBUG: 'netdns=go',
          // Hermetic User-Agent: the generated runtime sniffs these at init
          // (sdk.userAgent.aiAgentEnvVars) and would append an agent slug.
          CLAUDE_CODE: '',
          CURSOR_AGENT: '',
          CLINE_ACTIVE: '',
          WINDSURF_ACTIVE: '',
          COPILOT_AGENT: '',
        },
      });
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
