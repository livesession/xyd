import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { resolveChain } from '../index';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'opensdk-chain-'));
const write = (dir: string, rel: string, body: unknown) => {
  const p = path.join(dir, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof body === 'string' ? body : JSON.stringify(body, null, 2));
  return p;
};

// resolveChain only parses + validates the chain.json (it does not read the specs),
// so a source `location` can be any placeholder string here.
describe('resolveChain', () => {
  it('parses a valid chain and validates source refs', async () => {
    const dir = tmp();
    try {
      const chain = write(dir, 'chain.json', {
        version: 1,
        sources: { pet: { inputs: [{ location: './spec.json' }] } },
        targets: { 'pet-go': { target: 'go', source: 'pet' } },
      });
      const doc = await resolveChain(chain);
      expect(Object.keys(doc.sources)).toEqual(['pet']);
      expect(doc.targets['pet-go'].source).toBe('pet');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('throws on an unknown source reference and on missing sections', async () => {
    const dir = tmp();
    try {
      const bad = write(dir, 'chain.json', { version: 1, sources: { pet: { inputs: [{ location: './spec.json' }] } }, targets: { x: { target: 'go', source: 'nope' } } });
      await expect(resolveChain(bad)).rejects.toThrow(/unknown source "nope"/);
      const noTargets = write(dir, 'empty.json', { version: 1, sources: { pet: { inputs: [{ location: './spec.json' }] } }, targets: {} });
      await expect(resolveChain(noTargets)).rejects.toThrow(/at least one `targets`/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
