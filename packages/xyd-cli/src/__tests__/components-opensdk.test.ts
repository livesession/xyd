import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// The opensdk component contract, driven through the REAL built bin: before
// `components install opensdk` the `opensdk` command is a friendly error; after,
// it passes through to the actual @xyd-js/opensdk-cli. Offline: XYD_DEV_MODE=1
// resolves the toolchain from the monorepo build (no npm), and XYD_COMPONENTS_DIR
// points at a temp dir so nothing touches ~/.config/xyd.

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CLI = path.join(pkgRoot, 'dist/index.js');
const DEV_BIN = path.resolve(pkgRoot, '../xyd-opensdk-cli/dist/cli.js');

let componentsDir: string;

function runCli(args: string[]) {
    return spawnSync(process.execPath, [CLI, ...args], {
        encoding: 'utf8' as const,
        env: { ...process.env, XYD_DEV_MODE: '1', XYD_COMPONENTS_DIR: componentsDir },
    });
}

beforeAll(() => {
    // Root `pretest:unit` runs `pnpm build`, so both dists exist locally and in CI.
    if (!fs.existsSync(CLI) || !fs.existsSync(DEV_BIN)) {
        throw new Error('dist not built — run `pnpm build` first (root pretest:unit does this).');
    }
    componentsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xyd-opensdk-'));
});

afterAll(() => {
    fs.rmSync(componentsDir, { recursive: true, force: true });
});

describe('xyd opensdk (component passthrough)', () => {
    it('is a friendly error before install', () => {
        const r = runCli(['opensdk', '--help']);
        expect(r.status).not.toBe(0);
        expect(r.stderr).toContain('components install opensdk');
    });

    it("intercepts opensdk's own flags before the arg parser", () => {
        // `--lang` is unknown to xyd's `arg` spec — without the pre-parse
        // intercept this would crash with ARG_UNKNOWN_OPTION instead of the
        // friendly install hint.
        const r = runCli(['opensdk', 'generate', '--lang', 'go']);
        expect(r.status).not.toBe(0);
        expect(r.stderr).toContain('components install opensdk');
        expect(r.stderr).not.toContain('ARG_UNKNOWN_OPTION');
        expect(r.stderr).not.toContain('Unknown or unexpected option');
    });

    it('components install opensdk succeeds in dev mode', () => {
        const r = runCli(['components', 'install', 'opensdk']);
        expect(r.status, r.stderr).toBe(0);
        const manifest = JSON.parse(fs.readFileSync(path.join(componentsDir, 'opensdk', 'component.json'), 'utf8'));
        expect(manifest.name).toBe('opensdk');
        expect(manifest.mode).toBe('dev');
        expect(fs.existsSync(manifest.binPath)).toBe(true);
    });

    it('passes through to the real opensdk CLI after install', () => {
        const r = runCli(['opensdk', '--help']);
        expect(r.status, r.stderr).toBe(0);
        // The actual Commander help of @xyd-js/opensdk-cli — proves a real spawn.
        expect(r.stdout).toContain('Usage: opensdk');
        expect(r.stdout).toContain('generate');
        expect(r.stdout).toContain('parse');
    });

    it('components uninstall opensdk removes it and the error returns', () => {
        const r = runCli(['components', 'uninstall', 'opensdk']);
        expect(r.status, r.stderr).toBe(0);
        expect(fs.existsSync(path.join(componentsDir, 'opensdk'))).toBe(false);

        const after = runCli(['opensdk', '--help']);
        expect(after.status).not.toBe(0);
        expect(after.stderr).toContain('components install opensdk');
    });
});
