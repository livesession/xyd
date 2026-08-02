import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { resolveLanguage } from '@xyd-js/opensdk-framework';

import {
  CLI_CONVERTER_KEYS,
  cliBackendKeys,
  generateCliTarget,
  generateCommand,
  generateTargets,
  isCliTarget,
  parseCommand,
  publishTarget,
  registerBuiltinEmitters,
  resolveConfig,
  runChain,
  splitCliOptions,
} from '../src';

// The petstore OpenAPI doc vendored as the converter's 1.basic fixture.
const SPEC = path.join(__dirname, '../../xyd-openapi2opensdk/__fixtures__/1.basic/input.json');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'opensdk-clitargets-'));
const write = (dir: string, rel: string, body: unknown) => {
  const p = path.join(dir, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof body === 'string' ? body : JSON.stringify(body, null, 2));
  return p;
};

beforeAll(() => registerBuiltinEmitters());

describe('cli target routing', () => {
  it('recognizes exactly the CLI target ids (no aliases)', () => {
    expect(isCliTarget('go-cli')).toBe(true);
    expect(isCliTarget('rust-cli')).toBe(true);
    expect(isCliTarget('RUST-CLI')).toBe(true);
    expect(isCliTarget('go')).toBe(false);
    expect(isCliTarget('cli')).toBe(false);
    expect(isCliTarget(undefined)).toBe(false);
  });

  it('pins go-cli/rust-cli as unclaimed by the language alias table', () => {
    // The routing relies on resolveLanguage passing unknown ids through
    // unchanged; a future alias claiming these ids would silently break it.
    expect(resolveLanguage('go-cli')).toBe('go-cli');
    expect(resolveLanguage('rust-cli')).toBe('rust-cli');
  });
});

describe('splitCliOptions', () => {
  it('converter and backend key sets are disjoint for every backend', () => {
    for (const lang of ['go-cli', 'rust-cli']) {
      const overlap = (CLI_CONVERTER_KEYS as readonly string[]).filter((k) => cliBackendKeys(lang).includes(k));
      expect(overlap, `${lang} overlap`).toEqual([]);
    }
  });

  it('splits a flat mixed bag by allowlist', () => {
    const { converter, backend } = splitCliOptions('rust-cli', {
      cliName: 'acme',
      flagCase: 'kebab',
      crateName: 'acme-cli',
      baseURL: 'https://api.acme.dev',
    });
    expect(converter).toEqual({ cliName: 'acme', flagCase: 'kebab' });
    expect(backend).toEqual({ crateName: 'acme-cli', baseURL: 'https://api.acme.dev' });
  });

  it('rejects unknown keys, listing the valid ones', () => {
    expect(() => splitCliOptions('go-cli', { packageName: 'x' })).toThrow(/Unknown option\(s\) for "go-cli": packageName/);
    expect(() => splitCliOptions('go-cli', { packageName: 'x' })).toThrow(/modulePath/);
  });

  it('tolerates and strips the shared `tests` knob', () => {
    const { converter, backend } = splitCliOptions('go-cli', { tests: false });
    expect(converter).toEqual({});
    expect(backend).toEqual({});
  });
});

describe('generate --lang go-cli / rust-cli', () => {
  it('generates a Go CLI project through the OpenCLI pipeline', async () => {
    const dir = tmp();
    try {
      await generateCommand({ spec: SPEC, lang: 'go-cli', output: dir, sdkName: 'petstore' });
      expect(fs.existsSync(path.join(dir, 'go.mod'))).toBe(true);
      expect(fs.existsSync(path.join(dir, 'cmd/petstore/main.go'))).toBe(true);
      expect(fs.existsSync(path.join(dir, 'pkg/cmd/pets.go'))).toBe(true);
      // The framework write lifecycle applies to CLI outputs too.
      expect(fs.existsSync(path.join(dir, '.sdk/sdk.lock'))).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('generates a Rust CLI with mixed flat options (converter + backend)', async () => {
    const dir = tmp();
    try {
      await generateCommand({
        spec: SPEC,
        lang: 'rust-cli',
        output: dir,
        emitterOptions: { cliName: 'petstore', crateName: 'petstore_cli' },
      });
      const cargo = fs.readFileSync(path.join(dir, 'Cargo.toml'), 'utf8');
      expect(cargo).toContain('name = "petstore_cli"');
      expect(fs.existsSync(path.join(dir, 'src/gen/cmd/pets.rs'))).toBe(true);
      // The user-owned custom-code scaffold ships with every Rust CLI.
      expect(fs.existsSync(path.join(dir, 'src/custom/mod.rs'))).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('defaults the CLI name from sdkName', async () => {
    const dir = tmp();
    try {
      await generateCliTarget({ spec: SPEC, lang: 'go-cli', output: dir, sdkName: 'acme' });
      expect(fs.existsSync(path.join(dir, 'cmd/acme/main.go'))).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rejects a pre-parsed OpenSDK IR with a friendly error', async () => {
    const dir = tmp();
    try {
      const ir = path.join(dir, 'ir.json');
      await parseCommand({ spec: SPEC, output: ir });
      await expect(generateCommand({ spec: ir, lang: 'go-cli', output: path.join(dir, 'out') })).rejects.toThrow(
        /generate from the OpenAPI document, not a pre-parsed OpenSDK IR/,
      );
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('--dry-run writes nothing', async () => {
    const dir = tmp();
    try {
      const out = path.join(dir, 'never-created');
      await generateCommand({ spec: SPEC, lang: 'rust-cli', output: out, dryRun: true });
      expect(fs.existsSync(out)).toBe(false);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('generateTargets partition (sdk.json with SDK + CLI sections)', () => {
  it('generates SDK and CLI sections side by side', async () => {
    const dir = tmp();
    try {
      write(dir, 'sdk.json', {
        version: 1,
        sdkName: 'petstore',
        go: { output: path.join(dir, 'out/go-sdk'), tests: false },
        'go-cli': { output: path.join(dir, 'out/go-cli'), cliName: 'petstore' },
      });
      const config = await resolveConfig(dir);
      expect(config).not.toBeNull();
      await generateTargets({ spec: SPEC, output: path.join(dir, 'out'), config: config!, sdkName: 'petstore' });
      expect(fs.existsSync(path.join(dir, 'out/go-sdk/client.go'))).toBe(true);
      expect(fs.existsSync(path.join(dir, 'out/go-cli/cmd/petstore/main.go'))).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('a CLI-only config generates without SDK sections', async () => {
    const dir = tmp();
    try {
      write(dir, 'sdk.json', {
        version: 1,
        'rust-cli': { output: path.join(dir, 'out/rust-cli'), cliName: 'petstore' },
      });
      const config = await resolveConfig(dir);
      await generateTargets({ spec: SPEC, output: path.join(dir, 'out'), config: config! });
      expect(fs.existsSync(path.join(dir, 'out/rust-cli/Cargo.toml'))).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('publish', () => {
  it('skips CLI targets without throwing (even when the dir does not exist)', () => {
    expect(() => publishTarget('go-cli', '/nonexistent-cli-dir', {})).not.toThrow();
    expect(() => publishTarget('rust-cli', '/nonexistent-cli-dir', {})).not.toThrow();
  });
});

describe('chain integration (the routing seam the chain engine hits)', () => {
  it('a chain with an SDK target and a CLI target generates both', async () => {
    const dir = tmp();
    try {
      const chainPath = write(dir, 'chain.json', {
        version: 1,
        sources: { petstore: { inputs: [{ location: SPEC }] } },
        targets: {
          'petstore-node': {
            target: 'node',
            source: 'petstore',
            output: path.join(dir, 'sdk-node'),
            options: { tests: false },
          },
          'petstore-cli': {
            target: 'go-cli',
            source: 'petstore',
            output: path.join(dir, 'cli-go'),
            options: { cliName: 'petstore' },
          },
        },
      });
      await runChain({ chain: chainPath, cwd: dir });
      expect(fs.existsSync(path.join(dir, 'sdk-node/package.json'))).toBe(true);
      expect(fs.existsSync(path.join(dir, 'cli-go/cmd/petstore/main.go'))).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
