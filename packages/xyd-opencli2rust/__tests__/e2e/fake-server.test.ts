import { execSync, spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { opencli2rust, writeProject } from '../../index';
import { slug } from '../../src/naming';
import { hasCargo } from './harness';

// Response-side e2e (the complement of openai.test.ts, which diffs the REQUESTS
// a real CLI sends): build the 1.basic sample CLI, run it against a fake-data
// API server, and assert what a user actually sees — stdout, stderr, exit codes,
// and that auth from the env reached the server.
const E2E = process.env.E2E_CLI === '1';

const SPEC = path.join(__dirname, '../../__fixtures__/1.basic/input.json');

/** A fake "models" API: a list, one item, 404s for the rest. */
class FakeApiServer {
  private server: http.Server;
  port = 0;
  lastAuth: string | undefined;

  constructor() {
    this.server = http.createServer((req, res) => {
      this.lastAuth = req.headers.authorization;
      const respond = (status: number, body: unknown) => {
        res.writeHead(status, { 'content-type': 'application/json' });
        res.end(JSON.stringify(body));
      };
      if (req.url === '/models') {
        respond(200, { object: 'list', data: [{ id: 'gpt-4', owned_by: 'acme' }, { id: 'gpt-3.5', owned_by: 'acme' }] });
      } else if (req.url === '/models/gpt-4') {
        respond(200, { id: 'gpt-4', object: 'model', owned_by: 'acme' });
      } else {
        respond(404, { error: { message: 'model not found', type: 'invalid_request_error' } });
      }
    });
  }

  start(): Promise<void> {
    return new Promise((r) =>
      this.server.listen(0, '127.0.0.1', () => {
        this.port = (this.server.address() as { port: number }).port;
        r();
      }),
    );
  }

  stop() {
    this.server.close();
  }
}

interface RunResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

function run(binPath: string, args: string[], env: NodeJS.ProcessEnv): Promise<RunResult> {
  return new Promise((resolve) => {
    const p = spawn(binPath, args, { env });
    let stdout = '';
    let stderr = '';
    p.stdout.on('data', (c) => (stdout += c));
    p.stderr.on('data', (c) => (stderr += c));
    const t = setTimeout(() => p.kill('SIGKILL'), 15000);
    p.on('close', (code) => {
      clearTimeout(t);
      resolve({ code, stdout, stderr });
    });
  });
}

describe.runIf(E2E)('e2e: generated CLI against a fake-data server', () => {
  const server = new FakeApiServer();
  let tmpDir = '';
  let binPath = '';
  let env: NodeJS.ProcessEnv;

  beforeAll(async () => {
    if (!hasCargo()) throw new Error('cargo toolchain not available');
    await server.start();

    const spec = JSON.parse(fs.readFileSync(SPEC, 'utf8'));
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'o2r-fake-'));
    await writeProject(opencli2rust(spec), tmpDir);
    const targetDir = process.env.CARGO_TARGET_DIR || path.join(tmpDir, 'target');
    execSync('cargo build --quiet', { cwd: tmpDir, stdio: 'pipe', env: { ...process.env, CARGO_TARGET_DIR: targetDir } });
    binPath = path.join(targetDir, 'debug', slug(spec.info?.title || 'cli'));

    env = {
      ...process.env,
      SAMPLE_API_BASE_URL: `http://127.0.0.1:${server.port}`,
      SAMPLE_API_API_KEY: 'sk-fake-e2e',
    };
  }, 600000);

  afterAll(() => {
    server.stop();
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('lists fake data as pretty JSON and exits 0', async () => {
    const r = await run(binPath, ['models', 'list'], env);
    expect(r.code, r.stderr).toBe(0);
    const parsed = JSON.parse(r.stdout);
    expect(parsed.object).toBe('list');
    expect(parsed.data.map((m: { id: string }) => m.id)).toEqual(['gpt-4', 'gpt-3.5']);
    // Pretty-printed (the CliOverrides default), not a single-line dump.
    expect(r.stdout).toContain('\n  ');
  });

  it('retrieves one item by positional arg and sends bearer auth from the env', async () => {
    const r = await run(binPath, ['models', 'retrieve', 'gpt-4'], env);
    expect(r.code, r.stderr).toBe(0);
    expect(JSON.parse(r.stdout)).toEqual({ id: 'gpt-4', object: 'model', owned_by: 'acme' });
    expect(server.lastAuth).toBe('Bearer sk-fake-e2e');
  });

  it('surfaces API errors on stderr with a non-zero exit', async () => {
    const r = await run(binPath, ['models', 'retrieve', 'does-not-exist'], env);
    expect(r.code).toBe(1);
    expect(r.stdout).toBe('');
    expect(r.stderr).toContain('request failed: 404');
    expect(r.stderr).toContain('model not found');
  });

  it('rejects unknown commands via clap without contacting the server', async () => {
    const r = await run(binPath, ['nonsense'], env);
    expect(r.code).not.toBe(0);
    expect(r.stderr).toContain('unrecognized subcommand');
  });
});
