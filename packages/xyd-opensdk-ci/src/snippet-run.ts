import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { Method, NamedType, OpensdkSpecJson } from '@xyd-js/opensdk-core';
import type { Emitter, EmitterContext } from '@xyd-js/opensdk-framework';
import { generate, resolveLanguage } from '@xyd-js/opensdk-framework';

import { hasCommand } from './golden';
import { type RecordedRequest, RecordingServer, normalizeRecorded } from './e2e';
import { apiKeyEnvFor } from './sdk-e2e';
import { placeSnippet } from './usage-compile';

// Ask C, part 2: does a generated USAGE snippet, when RUN, produce the expected
// HTTP request? Complements compileUsageSnippet (which only proves the snippet
// COMPILES). We generate the whole SDK, drop the snippet in as the language's
// buildable entry, point the snippet's client base URL at an in-process
// RecordingServer (via the `E2E_BASE_URL` env var — the emitter's generateUsage
// honors `emitterOptions.baseUrlEnv`), build+run it, and return the captured
// request for the caller to diff against expectedRequest(ir, method).
//
// The base-url env var the snippet reads. Emitters that support runnable snippets
// construct the client with `option.WithBaseURL(os.Getenv(baseUrlEnv))` (etc.)
// when `emitterOptions.baseUrlEnv` is set.
export const SNIPPET_BASE_URL_ENV = 'E2E_BASE_URL';

/** The per-language build+run seam for a placed snippet project. */
export interface SnippetRunner {
  /** Canonical language id (for the toolchain probe / skip). */
  lang: string;
  /** Command that proves the toolchain is installed (e.g. 'node --version'). */
  toolchainProbe: string;
  /**
   * Build the project already written at `dir` (the whole SDK + the placed
   * snippet entry) and run its snippet entry with `env` (carries the api-key var
   * + `E2E_BASE_URL`). Resolve when the run finishes; the request it made is read
   * from the shared RecordingServer, not returned here.
   */
  run(dir: string, env: NodeJS.ProcessEnv): Promise<void>;
}

export interface RunUsageSnippetConfig {
  ir: OpensdkSpecJson;
  method: Method;
  chain: string[];
  emitter: Emitter;
  runner: SnippetRunner;
  sdkName: string;
  opts?: Record<string, unknown>;
}

/**
 * Generate the SDK + snippet for one method, run the snippet against a recording
 * server, and return the request it produced. Returns `null` (skip) when the
 * toolchain is absent, the emitter has no snippet, or the snippet made no request
 * (e.g. the emitter doesn't yet honor `baseUrlEnv`, so it never hit the server).
 * THROWS only if the runner build itself fails.
 */
export async function runUsageSnippet(cfg: RunUsageSnippetConfig): Promise<RecordedRequest | null> {
  const { ir, method, chain, emitter, runner, sdkName, opts = {} } = cfg;
  const canonical = resolveLanguage(runner.lang);
  if (!hasCommand(runner.toolchainProbe)) return null;

  const emitterOptions = { ...opts, baseUrlEnv: SNIPPET_BASE_URL_ENV };
  const types = new Map<string, NamedType>((ir.types ?? []).map((t) => [t.name, t]));
  const ctx: EmitterContext = { spec: ir, types, emitterOptions };
  const snippet = emitter.generateUsage?.(method, chain, ctx);
  if (!snippet) return null;

  const files: Record<string, string> = { ...generate(ir, emitter, emitterOptions) };
  placeSnippet(canonical, files, snippet);

  const server = new RecordingServer();
  await server.start();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `o2s-snip-run-${canonical}-`));
  try {
    for (const [rel, content] of Object.entries(files)) {
      const target = path.join(dir, rel);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content);
    }
    const apiKeyEnv = apiKeyEnvFor(ir, sdkName);
    server.last = null;
    await runner.run(dir, {
      ...process.env,
      [apiKeyEnv]: 'sk-e2e-test',
      [SNIPPET_BASE_URL_ENV]: `http://127.0.0.1:${server.port}`,
    });
    return server.last ? normalizeRecorded(server.last) : null;
  } finally {
    server.stop();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
