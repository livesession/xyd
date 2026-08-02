import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { compileSmoke } from '@xyd-js/opensdk-ci';

import { registerBuiltinEmitters, runChain } from '../../src';

// Gated chain e2e for CLI OUTPUT targets: `opensdk run` with go-cli + rust-cli
// targets, then each generated project must COMPILE with its real toolchain
// (compileSmoke maps the pseudo-lang to its base toolchain: go-cli → go build,
// rust-cli → cargo build). Runs in the tests-opensdk-pipeline CI job, which
// provisions both toolchains.
const E2E = process.env.E2E_SDK_CHAIN === '1';

// The petstore OpenAPI doc vendored as the converter's 1.basic fixture.
const SPEC = path.join(__dirname, '../../../xyd-openapi2opensdk/__fixtures__/1.basic/input.json');

describe.runIf(E2E)('chain e2e: CLI output targets compile', () => {
  it(
    'opensdk run with go-cli + rust-cli targets → both generated CLIs compile',
    async () => {
      registerBuiltinEmitters();
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'opensdk-cli-chain-'));
      try {
        const chainPath = path.join(dir, 'chain.json');
        fs.writeFileSync(
          chainPath,
          JSON.stringify(
            {
              version: 1,
              sources: { petstore: { inputs: [{ location: SPEC }] } },
              targets: {
                'petstore-go-cli': {
                  target: 'go-cli',
                  source: 'petstore',
                  output: path.join(dir, 'cli-go'),
                  options: { cliName: 'petstore' },
                },
                'petstore-rust-cli': {
                  target: 'rust-cli',
                  source: 'petstore',
                  output: path.join(dir, 'cli-rust'),
                  options: { cliName: 'petstore' },
                },
              },
            },
            null,
            2,
          ),
        );
        await runChain({ chain: chainPath, cwd: dir });

        expect(fs.existsSync(path.join(dir, 'cli-go/cmd/petstore/main.go'))).toBe(true);
        expect(fs.existsSync(path.join(dir, 'cli-rust/src/custom/mod.rs'))).toBe(true);

        // compileSmoke returns false only when the toolchain is absent — the CI
        // job provisions both, so treat a skip as a real signal locally too.
        expect(compileSmoke('go', path.join(dir, 'cli-go')), 'go toolchain missing?').toBe(true);
        expect(compileSmoke('rust', path.join(dir, 'cli-rust')), 'rust toolchain missing?').toBe(true);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    },
    600000,
  );
});
