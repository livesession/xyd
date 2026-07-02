import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import type { Emitter } from '@xyd-js/opensdk-framework';
import { generate, getEmitter } from '@xyd-js/opensdk-framework';

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
  it('scaffolds opensdk.config.mjs once', async () => {
    const dir = tmp();
    try {
      await initCommand({ project: dir });
      expect(fs.readFileSync(path.join(dir, 'opensdk.config.mjs'), 'utf8')).toContain('emitters');
      await expect(initCommand({ project: dir })).rejects.toThrow(/already initialized/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
