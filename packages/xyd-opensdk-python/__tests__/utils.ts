import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { expect } from 'vitest';

import { hasCommand, listFiles, writeTree } from '@xyd-js/opensdk-ci';

import { opensdkPython } from '../index';
import type { OpensdkPythonOptions } from '../index';

const REGENERATE = process.env.REGEN === '1';

// O2S_PY_SMOKE=1 (and a python3) enables a `py_compile` smoke of the generated tree.
export const PY_SMOKE = process.env.O2S_PY_SMOKE === '1' && hasCommand('python3 --version');

function fixturePath(name: string): string {
  return path.join(__dirname, '../__fixtures__', name);
}

export function readIR(name: string) {
  return JSON.parse(fs.readFileSync(path.join(fixturePath(name), 'input.json'), 'utf8'));
}

/** Golden test: opensdkPython(input.json) === the committed output/ file tree. */
export function testFixture(name: string, options?: OpensdkPythonOptions) {
  const files = opensdkPython(readIR(name), options);
  const outDir = path.join(fixturePath(name), 'output');

  if (REGENERATE) writeTree(outDir, files);

  const expected = listFiles(outDir);
  expect(Object.keys(files).sort()).toEqual(Object.keys(expected).sort());
  for (const [rel, content] of Object.entries(files)) {
    expect(content, `mismatch in ${name}/${rel}`).toEqual(expected[rel]);
  }
}

/** Optional: write the project to a temp dir and `python3 -m py_compile` every module. */
export function pyCompileSmoke(name: string, options?: OpensdkPythonOptions) {
  const files = opensdkPython(readIR(name), options);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `o2py-${name.replace(/\W/g, '')}-`));
  try {
    writeTree(dir, files);
    const modules = Object.keys(files).filter((f) => f.endsWith('.py'));
    // The generated pytest suite (tests/*.py) is part of the compiled set, so
    // the smoke provably covers it — not just the package modules.
    expect(modules.some((m) => m.startsWith('tests/')), `${name}: no generated tests/*.py to compile`).toBe(true);
    execSync(`python3 -m py_compile ${modules.map((m) => JSON.stringify(m)).join(' ')}`, { cwd: dir, stdio: 'pipe' });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Optional: import the generated 1.basic transport in a REAL python3 and probe
 * the behavior helpers — Retry-After parsing (both forms), the backoff+jitter
 * envelope, the status -> exception dispatch with request_id, the request
 * guard, and the User-Agent assembly.
 */
export function pyBehaviorSmoke() {
  const files = opensdkPython(readIR('1.basic'));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'o2py-behavior-'));
  const script = `import datetime
import email.utils

from petstore._transport import (
    BACKOFF_INITIAL_DELAY,
    BACKOFF_JITTER,
    USER_AGENT,
    APIError,
    InternalError,
    NotFoundError,
    _error_for_status,
    _guard_options,
    _retry_after_seconds,
    _retry_delay,
    _user_agent,
)

# Retry-After: integer-seconds form and HTTP-date form (case-insensitive header).
assert _retry_after_seconds({"retry-after": "3"}) == 3.0
future = email.utils.format_datetime(datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=5))
http_date = _retry_after_seconds({"Retry-After": future})
assert http_date is not None and 0.0 <= http_date <= 5.0, http_date

# Backoff: first delay in the [initial, initial * (1 + jitter)] envelope; Retry-After wins.
first = _retry_delay(0, None)
assert BACKOFF_INITIAL_DELAY <= first <= BACKOFF_INITIAL_DELAY * (1 + BACKOFF_JITTER), first
assert _retry_delay(1, {"Retry-After": "7"}) == 7.0

# Error kinds: mapped status, 5xx catch-all, client catch-all; request_id from the policy header.
err = _error_for_status(404, {"x-request-id": "req_123"}, b'{"error": {"message": "nope"}}')
assert isinstance(err, NotFoundError) and err.kind == "NotFound"
assert err.request_id == "req_123" and err.message == "nope"
assert isinstance(_error_for_status(503, {}, b""), InternalError)
assert type(_error_for_status(418, {}, b"")) is APIError

# Request guard: option keys misplaced into params fail fast, naming the key.
try:
    _guard_options({"api_key": "sk-leak"})
except ValueError as error:
    assert "api_key" in str(error)
else:
    raise AssertionError("request guard did not fire")

assert _user_agent().startswith(USER_AGENT)
`;
  try {
    writeTree(dir, files);
    fs.writeFileSync(path.join(dir, '_behavior_check.py'), script);
    execSync('python3 _behavior_check.py', { cwd: dir, stdio: 'pipe' });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
