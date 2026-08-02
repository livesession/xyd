import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import colors from 'picocolors';

// The `opensdk` CLI component: the @xyd-js/opensdk-cli toolchain, installed ON
// DEMAND (`xyd components install opensdk`) so the default CLI stays lean — the
// published opensdk tree (all language emitters + the OpenAPI pipeline) is heavy
// and must never ship with `xyd` itself. State and payload live together in a
// self-contained component dir; nothing here imports any opensdk code.

const OPENSDK_PACKAGE = '@xyd-js/opensdk-cli';

interface OpensdkManifest {
    name: 'opensdk';
    package: string;
    version: string;
    mode: 'dev' | 'published';
    binPath: string;
    installedAt: string;
}

/** Where CLI components live: user-global (survives CLI upgrades, permission-safe
 * under root-owned npm prefixes — same home as shell completions), overridable
 * via XYD_COMPONENTS_DIR (the test seam). */
export function componentsBaseDir(): string {
    return process.env.XYD_COMPONENTS_DIR || path.join(os.homedir(), '.config', 'xyd', 'components');
}

export function opensdkComponentDir(): string {
    return path.join(componentsBaseDir(), 'opensdk');
}

function manifestPath(): string {
    return path.join(opensdkComponentDir(), 'component.json');
}

function readManifest(): OpensdkManifest | null {
    try {
        return JSON.parse(fs.readFileSync(manifestPath(), 'utf8')) as OpensdkManifest;
    } catch {
        return null;
    }
}

/** The installed opensdk bin, or null when the component isn't (validly) installed. */
export function resolveOpensdkBin(): string | null {
    const manifest = readManifest();
    if (!manifest?.binPath) return null;
    return fs.existsSync(manifest.binPath) ? manifest.binPath : null;
}

/** Dev mode: the monorepo's built opensdk-cli, found by walking up from this module. */
function findMonorepoOpensdkBin(): string | null {
    let dir = path.dirname(fileURLToPath(import.meta.url));
    for (let i = 0; i < 6; i++) {
        const candidate = path.join(dir, 'packages', 'xyd-opensdk-cli', 'dist', 'cli.js');
        if (fs.existsSync(candidate)) return candidate;
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    return null;
}

export async function installOpensdk(): Promise<boolean> {
    const existing = resolveOpensdkBin();
    if (existing) {
        console.log(colors.green(`✓ opensdk is already installed (${existing})`));
        return true;
    }

    const dir = opensdkComponentDir();
    fs.mkdirSync(dir, { recursive: true });

    let binPath: string;
    let mode: OpensdkManifest['mode'];
    let version = 'latest';

    if (process.env.XYD_DEV_MODE) {
        // Dev mode: no npm — point at the monorepo build (external deps resolve
        // through the monorepo's own node_modules, relative to the module file).
        const devBin = findMonorepoOpensdkBin();
        if (!devBin) {
            console.error(
                colors.red('XYD_DEV_MODE is set but packages/xyd-opensdk-cli/dist/cli.js was not found — run `pnpm build` first.'),
            );
            return false;
        }
        binPath = devBin;
        mode = 'dev';
        version = 'workspace';
    } else {
        console.log(`Installing ${OPENSDK_PACKAGE}...`);
        fs.writeFileSync(
            path.join(dir, 'package.json'),
            `${JSON.stringify({ name: 'xyd-component-opensdk', private: true, dependencies: { [OPENSDK_PACKAGE]: version } }, null, 2)}\n`,
        );
        const { nodeInstallPackages } = await import('@xyd-js/documan');
        try {
            await nodeInstallPackages(dir);
        } catch (err) {
            console.error(colors.red(`Failed to install ${OPENSDK_PACKAGE}: ${err instanceof Error ? err.message : err}`));
            return false;
        }
        binPath = path.join(dir, 'node_modules', '@xyd-js', 'opensdk-cli', 'dist', 'cli.js');
        mode = 'published';
        if (!fs.existsSync(binPath)) {
            console.error(colors.red(`Install finished but the opensdk bin is missing at ${binPath}.`));
            return false;
        }
    }

    const manifest: OpensdkManifest = {
        name: 'opensdk',
        package: OPENSDK_PACKAGE,
        version,
        mode,
        binPath,
        installedAt: new Date().toISOString(),
    };
    fs.writeFileSync(manifestPath(), `${JSON.stringify(manifest, null, 2)}\n`);

    console.log(colors.green('✓ opensdk installed.'));
    console.log('Run `xyd opensdk --help` to get started.');
    return true;
}

export function uninstallOpensdk(): boolean {
    const dir = opensdkComponentDir();
    if (!fs.existsSync(dir)) {
        console.log('opensdk is not installed — nothing to remove.');
        return true;
    }
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(colors.green('✓ opensdk uninstalled.'));
    return true;
}

/** Spawn the installed opensdk CLI with raw args, propagating the exit code. */
export function runOpensdk(args: string[]): never {
    const bin = resolveOpensdkBin();
    if (!bin) {
        console.error(colors.red('The opensdk toolchain is not installed.'));
        console.error(`Install it with: ${colors.bold('xyd components install opensdk')}`);
        process.exit(1);
    }
    const result = spawnSync(process.execPath, [bin, ...args], { stdio: 'inherit' });
    if (result.error) {
        console.error(colors.red(`Failed to run opensdk: ${result.error.message}`));
        process.exit(1);
    }
    process.exit(result.status ?? 1);
}
