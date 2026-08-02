// The override-story acceptance tests: user-owned files survive regeneration
// (skipIfExists), and — with `{ merge: true }` — hand-edits to GENERATED files
// survive via the framework's 3-way merge.

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { opencli2rust, writeProject } from '../index';
import { CARGO_SMOKE } from './utils';

const FIXTURE = path.join(__dirname, '../__fixtures__/5.custom-scaffold');
const spec = () => JSON.parse(fs.readFileSync(path.join(FIXTURE, 'input.json'), 'utf8'));
const customized = () => fs.readFileSync(path.join(FIXTURE, 'custom.rs'), 'utf8');

describe('custom code survives regeneration', () => {
  it('skipIfExists preserves user-owned files across regen', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'o2r-custom-'));
    try {
      await writeProject(opencli2rust(spec()), dir);

      // The user customizes their scaffold + manifest.
      fs.writeFileSync(path.join(dir, 'src/custom/mod.rs'), customized());
      const cargo = `${fs.readFileSync(path.join(dir, 'Cargo.toml'), 'utf8')}\n[profile.release]\nlto = "thin"\n`;
      fs.writeFileSync(path.join(dir, 'Cargo.toml'), cargo);

      const result = await writeProject(opencli2rust(spec()), dir);

      expect(fs.readFileSync(path.join(dir, 'src/custom/mod.rs'), 'utf8')).toEqual(customized());
      expect(fs.readFileSync(path.join(dir, 'Cargo.toml'), 'utf8')).toEqual(cargo);
      expect(result.skipped).toContain('src/custom/mod.rs');
      expect(result.skipped).toContain('Cargo.toml');
      expect(fs.existsSync(path.join(dir, '.sdk/sdk.lock'))).toBe(true);

      if (CARGO_SMOKE) {
        // The CUSTOMIZED scaffold must compile against the regenerated code.
        execSync('cargo check --quiet', {
          cwd: dir,
          stdio: 'pipe',
          env: { ...process.env, CARGO_TARGET_DIR: process.env.CARGO_TARGET_DIR || path.join(os.tmpdir(), 'o2r-target') },
        });
      }
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('merge mode preserves hand-edits to generated files', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'o2r-merge-'));
    try {
      await writeProject(opencli2rust(spec()), dir, { merge: true });

      const cliPath = path.join(dir, 'src/gen/cli.rs');
      const HAND_EDIT = '// hand-edit that must survive regeneration\n';
      fs.writeFileSync(cliPath, `${fs.readFileSync(cliPath, 'utf8')}\n${HAND_EDIT}`);

      // Same spec: the generation didn't change, so the edited file is left alone.
      const noop = await writeProject(opencli2rust(spec()), dir, { merge: true });
      expect(noop.unchanged).toContain('src/gen/cli.rs');
      expect(fs.readFileSync(cliPath, 'utf8')).toContain(HAND_EDIT);

      // Changed spec (new root summary → new .about line in cli.rs): the 3-way
      // merge lands BOTH the generator's change and the user's hand-edit.
      const changed = spec();
      changed.info = { ...changed.info, summary: 'An updated summary from a regen' };
      const result = await writeProject(opencli2rust(changed), dir, { merge: true });

      const merged = fs.readFileSync(cliPath, 'utf8');
      expect(merged).toContain('An updated summary from a regen');
      expect(merged).toContain(HAND_EDIT);
      expect(result.merged).toContain('src/gen/cli.rs');
      expect(result.mergeConflicts).toEqual([]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
