import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import type { Emitter } from '@xyd-js/opensdk-framework';
import { generate, getEmitter, registerEmitter } from '@xyd-js/opensdk-framework';

import { applyConfig, generateCommand, initCommand, loadConfig, parseCommand, registerBuiltinEmitters } from '../src';

// The petstore OpenAPI doc vendored as the converter's 1.basic fixture.
const SPEC = path.join(__dirname, '../../xyd-openapi2opensdk/__fixtures__/1.basic/input.json');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'opensdk-cli-'));

describe('parse command', () => {
  it('writes the OpenSDK IR for an OpenAPI spec', async () => {
    const dir = tmp();
    try {
      const out = path.join(dir, 'ir.json');
      await parseCommand({ spec: SPEC, output: out });
      const ir = JSON.parse(fs.readFileSync(out, 'utf8'));
      expect(ir.opensdk).toBe('1.0.0');
      expect(ir.resources?.[0]?.name).toBe('pets');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('generate command', () => {
  it('generates the go SDK through the registered emitter', async () => {
    registerBuiltinEmitters();
    const dir = tmp();
    try {
      await generateCommand({ spec: SPEC, lang: 'go', output: dir });
      expect(fs.existsSync(path.join(dir, 'client.go'))).toBe(true);
      expect(fs.existsSync(path.join(dir, 'go.mod'))).toBe(true);
      expect(fs.existsSync(path.join(dir, 'pets.go'))).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('generates the python SDK and accepts a pre-parsed IR json', async () => {
    registerBuiltinEmitters();
    const dir = tmp();
    try {
      const irPath = path.join(dir, 'ir.json');
      await parseCommand({ spec: SPEC, output: irPath });
      await generateCommand({ spec: irPath, lang: 'python', output: path.join(dir, 'sdk') });
      expect(fs.existsSync(path.join(dir, 'sdk/pyproject.toml'))).toBe(true);
      expect(fs.existsSync(path.join(dir, 'sdk/petstore/_client.py'))).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rejects an unregistered language with the available set', async () => {
    registerBuiltinEmitters();
    await expect(generateCommand({ spec: SPEC, lang: 'cobol', output: tmp() })).rejects.toThrow(
      /Unknown opensdk language: cobol/,
    );
  });

  it('remounts resources from a --grouping json (pets -> beta/pets)', async () => {
    registerBuiltinEmitters();
    const dir = tmp();
    try {
      const groupingPath = path.join(dir, 'grouping.json');
      fs.writeFileSync(groupingPath, JSON.stringify({ mountRules: { pets: 'beta/pets' } }));
      const out = path.join(dir, 'sdk');
      await generateCommand({ spec: SPEC, lang: 'go', output: out, grouping: groupingPath });
      // The go emitter writes one file per top-level resource: mounting pets
      // under beta yields beta.go (pets is its nested service) and no pets.go.
      expect(fs.existsSync(path.join(out, 'beta.go'))).toBe(true);
      expect(fs.existsSync(path.join(out, 'pets.go'))).toBe(false);
      expect(fs.existsSync(path.join(out, 'client.go'))).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rejects a missing --grouping path', async () => {
    registerBuiltinEmitters();
    await expect(
      generateCommand({ spec: SPEC, lang: 'go', output: tmp(), grouping: 'nope.grouping.json' }),
    ).rejects.toThrow(/Grouping file not found/);
  });
});

describe('config loading (plugin bundle)', () => {
  it('loads an opensdk.config.mjs and registers its emitters', async () => {
    const dir = tmp();
    try {
      fs.writeFileSync(
        path.join(dir, 'opensdk.config.mjs'),
        `export default {
  emitters: [{
    language: 'stub',
    generateProject: () => [{ path: 'stub.txt', content: 'hello' }],
    generateClient: () => [],
    generateTypes: () => [],
    generateResources: () => [],
    generateRuntime: () => [],
  }],
  emitterOptions: { go: { modulePath: 'github.com/acme/acme-go' } },
};
`,
      );
      const config = await loadConfig(undefined, dir);
      expect(config?.emitterOptions?.go?.modulePath).toBe('github.com/acme/acme-go');
      applyConfig(config!);
      const stub = getEmitter('stub') as Emitter;
      expect(generate({ opensdk: '1.0.0', info: { title: 't', version: '1' } }, stub)).toEqual({ 'stub.txt': 'hello' });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('returns null with no config, throws for a missing explicit path', async () => {
    const dir = tmp();
    try {
      expect(await loadConfig(undefined, dir)).toBeNull();
      await expect(loadConfig('nope.config.mjs', dir)).rejects.toThrow(/Config file not found/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('init command', () => {
  it('scaffolds sdk.json by default, once', async () => {
    const dir = tmp();
    try {
      await initCommand({ project: dir });
      const doc = JSON.parse(fs.readFileSync(path.join(dir, 'sdk.json'), 'utf8'));
      expect(doc.version).toBe(1);
      expect(doc.$schema).toContain('sdk.schema.json');
      expect(doc.typescript).toBeDefined();
      await expect(initCommand({ project: dir })).rejects.toThrow(/already initialized/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('scaffolds opensdk.config.mjs with --format mjs', async () => {
    const dir = tmp();
    try {
      await initCommand({ project: dir, format: 'mjs' });
      expect(fs.readFileSync(path.join(dir, 'opensdk.config.mjs'), 'utf8')).toContain('emitters');
      await expect(initCommand({ project: dir, format: 'mjs' })).rejects.toThrow(/already initialized/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

// Recursively list every generated file, path relative to `root`.
function walkFiles(root: string, prefix = ''): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(path.join(root, prefix), { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...walkFiles(root, rel));
    else out.push(rel);
  }
  return out;
}

// The go emitter's self-test suite (generateTests) lands in parallel with the
// CLI. Detect it on the freshly-built emitter so the strict go assertions run
// (and enforce both directions) once it's present, and the suite stays green in
// the interim. The --no-tests WIRING itself is proven deterministically below.
function goHasTestEmitter(): boolean {
  registerBuiltinEmitters();
  return typeof (getEmitter('go') as Emitter).generateTests === 'function';
}
const GO_TEST_EMITTER = goHasTestEmitter();

describe('generate --no-tests (self-test suite emission)', () => {
  it.skipIf(!GO_TEST_EMITTER)('go emits a *_test.go suite + internal/testutil/testutil.go by default', async () => {
    registerBuiltinEmitters();
    const dir = tmp();
    try {
      await generateCommand({ spec: SPEC, lang: 'go', output: dir });
      const files = walkFiles(dir);
      expect(files.some((f) => f.endsWith('_test.go'))).toBe(true);
      expect(fs.existsSync(path.join(dir, 'internal/testutil/testutil.go'))).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it.skipIf(!GO_TEST_EMITTER)('go --no-tests emits no *_test.go and no testutil', async () => {
    registerBuiltinEmitters();
    const dir = tmp();
    try {
      await generateCommand({ spec: SPEC, lang: 'go', output: dir, noTests: true });
      const files = walkFiles(dir);
      expect(files.some((f) => f.endsWith('_test.go'))).toBe(false);
      expect(fs.existsSync(path.join(dir, 'internal/testutil/testutil.go'))).toBe(false);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  // Deterministic proof of the flag wiring, independent of the go emitter build:
  // --no-tests must thread { tests: false } onto the active language's
  // emitterOptions bag (alongside any config options), and omit it otherwise.
  it('--no-tests threads { tests: false } onto the active emitter options; default leaves it unset', async () => {
    const seen: { tests?: unknown; modulePath?: unknown }[] = [];
    const stub: Emitter = {
      language: 'wiretest',
      generateProject: () => [{ path: 'x.txt', content: 'x' }],
      generateClient: () => [],
      generateTypes: () => [],
      generateResources: () => [],
      generateRuntime: () => [],
      generateTests: (_spec, ctx) => {
        seen.push({ tests: ctx.emitterOptions.tests, modulePath: ctx.emitterOptions.modulePath });
        return [{ path: 'wiretest_test.txt', content: 't' }];
      },
    };
    registerEmitter(stub);
    const dir = tmp();
    try {
      // WITH --no-tests: tests === false, and the config bag is preserved.
      await generateCommand({
        spec: SPEC,
        lang: 'wiretest',
        output: path.join(dir, 'off'),
        noTests: true,
        emitterOptions: { modulePath: 'github.com/acme/acme-go' },
      });
      expect(seen[0]).toEqual({ tests: false, modulePath: 'github.com/acme/acme-go' });

      // WITHOUT --no-tests: no tests key is injected (emitters default ON).
      await generateCommand({ spec: SPEC, lang: 'wiretest', output: path.join(dir, 'on') });
      expect(seen[1]?.tests).toBeUndefined();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
