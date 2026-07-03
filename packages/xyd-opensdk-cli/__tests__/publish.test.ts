import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { publishCommand, publishTarget, registerBuiltinEmitters } from '../src';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'opensdk-publish-'));

beforeAll(() => registerBuiltinEmitters());
afterEach(() => vi.restoreAllMocks());

describe('publishTarget', () => {
  it('errors clearly when the generated SDK dir is missing', () => {
    expect(() => publishTarget('node', path.join(os.tmpdir(), 'does-not-exist-xyz'), {})).toThrow(
      /No generated SDK/,
    );
  });

  it('go dry-run tags nothing and needs no toolchain (logs the tag it would create)', () => {
    const dir = tmp();
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      expect(() => publishTarget('golang', dir, { dryRun: true, version: '1.2.3' })).not.toThrow();
      expect(log.mock.calls.flat().join(' ')).toMatch(/would tag v1\.2\.3/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('publishCommand', () => {
  it('errors when no languages are declared and no --lang is given', async () => {
    await expect(publishCommand({ output: './sdk', config: null })).rejects.toThrow(/No languages to publish/);
  });

  it('resolves per-language output dirs from the config (missing dir surfaces per language)', async () => {
    const base = tmp();
    try {
      const config = {
        emitterOptions: { go: {} },
        targets: { go: { output: path.join(base, 'nope-go') } },
      };
      await expect(publishCommand({ output: base, config, dryRun: true })).rejects.toThrow(/No generated SDK/);
    } finally {
      fs.rmSync(base, { recursive: true, force: true });
    }
  });
});
