import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

// The "lean by default" contract of the opensdk component: the shipped CLI
// bundle must not grow with opensdk code or dependencies — the footprint may
// only appear AFTER an explicit `xyd components install opensdk`.

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const distDir = path.join(pkgRoot, 'dist');

/** Total dist JS budget. Current: ~73 KB; headroom for growth, but a hard stop
 * against accidentally bundling a toolchain (opensdk's dist alone is ~250 KB
 * before its 16-package dependency tree). */
const DIST_BUDGET_BYTES = 120 * 1024;

function distJsBytes(): number {
    return fs
        .readdirSync(distDir)
        .filter((f) => f.endsWith('.js'))
        .reduce((sum, f) => sum + fs.statSync(path.join(distDir, f)).size, 0);
}

function dirBytes(dir: string): number {
    let sum = 0;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        sum += entry.isDirectory() ? dirBytes(full) : fs.statSync(full).size;
    }
    return sum;
}

describe('default CLI bundle stays lean', () => {
    it(`dist JS stays under the ${DIST_BUDGET_BYTES / 1024} KB budget`, () => {
        expect(fs.existsSync(distDir), 'dist not built — run `pnpm build` first').toBe(true);
        expect(distJsBytes()).toBeLessThan(DIST_BUDGET_BYTES);
    });

    it('has no opensdk dependencies', () => {
        const pkg = JSON.parse(fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf8'));
        const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
        expect(deps.filter((d) => /opensdk/i.test(d))).toEqual([]);
    });

    it('bundles no opensdk implementation', () => {
        // The literal '@xyd-js/opensdk-cli' package NAME is expected (the
        // installer references it); actual toolchain code must never be bundled.
        const bundle = fs.readFileSync(path.join(distDir, 'index.js'), 'utf8');
        expect(bundle).not.toContain('generateFileMap');
        expect(bundle).not.toContain('registerEmitter');
    });
});

describe('footprint only grows after `components install opensdk`', () => {
    it('the component dir materializes only on install', () => {
        const componentsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xyd-size-'));
        try {
            const opensdkDir = path.join(componentsDir, 'opensdk');
            expect(fs.existsSync(opensdkDir)).toBe(false);

            const r = spawnSync(process.execPath, [path.join(distDir, 'index.js'), 'components', 'install', 'opensdk'], {
                encoding: 'utf8' as const,
                env: { ...process.env, XYD_DEV_MODE: '1', XYD_COMPONENTS_DIR: componentsDir },
            });
            expect(r.status, r.stderr).toBe(0);

            // Dev-mode installs are manifest-only; a published install pulls the
            // full @xyd-js/opensdk-cli tree (~250 KB dist + transitive deps)
            // into this same dir. Either way: absent before, non-empty after.
            expect(fs.existsSync(opensdkDir)).toBe(true);
            expect(dirBytes(opensdkDir)).toBeGreaterThan(0);
        } finally {
            fs.rmSync(componentsDir, { recursive: true, force: true });
        }
    });
});
