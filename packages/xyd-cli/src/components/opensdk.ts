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

/** Release assets live beside the `xyd-<triple>` ones — see
 * `.github/workflows/build-native-binaries.yml`. */
const OPENSDK_ASSET_BASE = 'https://github.com/livesession/xyd/releases/latest/download';

interface OpensdkManifest {
    name: 'opensdk';
    package: string;
    version: string;
    mode: 'dev' | 'published' | 'native';
    binPath: string;
    installedAt: string;
}

/** The `opensdk-<triple>` asset for this host, or null on a platform whose binary
 * isn't built yet (darwin-x64, windows — no matrix leg yet). */
function targetTriple(): string | null {
    if (process.platform === 'linux' && process.arch === 'x64') return 'linux-x64';
    if (process.platform === 'linux' && process.arch === 'arm64') return 'linux-arm64';
    if (process.platform === 'darwin' && process.arch === 'arm64') return 'darwin-arm64';
    return null;
}

/** Try the native payload: download `opensdk-<triple>` into `dir`.
 *
 * Returns null when it isn't available for this host — an unbuilt platform, or an
 * asset that isn't published yet (404) — and the caller falls back to npm. Any other
 * failure throws: silently falling back would hide a real outage behind a slower,
 * node-requiring install. `XYD_OPENSDK_URL` overrides the URL (canary, testing). */
async function installNativeOpensdk(dir: string): Promise<string | null> {
    let url = process.env.XYD_OPENSDK_URL;
    if (!url) {
        const triple = targetTriple();
        if (!triple) return null;
        url = `${OPENSDK_ASSET_BASE}/opensdk-${triple}`;
    }

    console.log(`Downloading opensdk (${url})...`);
    const response = await fetch(url);
    if (response.status === 404) return null;
    if (!response.ok) {
        throw new Error(`downloading ${url} failed with HTTP ${response.status}`);
    }

    const dest = path.join(dir, 'opensdk');
    fs.writeFileSync(dest, new Uint8Array(await response.arrayBuffer()));
    fs.chmodSync(dest, 0o755);
    return dest;
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

/** Dev mode: the monorepo's built opensdk, found by walking up from this module.
 *
 * Prefers the native `crates/target/{release,debug}/opensdk` (what ships) and falls
 * back to the legacy `packages/xyd-opensdk-cli/dist/cli.js`, so a dev tree that has
 * only run `pnpm build` still resolves. */
function findMonorepoOpensdkBin(): string | null {
    let dir = path.dirname(fileURLToPath(import.meta.url));
    for (let i = 0; i < 6; i++) {
        const candidates = [
            path.join(dir, 'crates', 'target', 'release', 'opensdk'),
            path.join(dir, 'crates', 'target', 'debug', 'opensdk'),
            path.join(dir, 'packages', 'xyd-opensdk-cli', 'dist', 'cli.js'),
        ];
        const found = candidates.find((c) => fs.existsSync(c));
        if (found) return found;
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    return null;
}

/** Whether a payload is the LEGACY npm toolchain (a `cli.js` needing a JS runtime)
 * rather than the native binary. Inferred from the extension, not a manifest field,
 * so installs written by either CLI stay interoperable. */
export function needsJsRuntime(bin: string): boolean {
    return bin.endsWith('.js');
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
    let nativeBin: string | null;

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
    } else if ((nativeBin = await installNativeOpensdk(dir).catch((err) => {
        console.error(colors.red(`Failed to download opensdk: ${err instanceof Error ? err.message : err}`));
        return null;
    }))) {
        binPath = nativeBin;
        mode = 'native';
    } else {
        // LEGACY: no `opensdk-<triple>` asset published yet. Delete this branch once
        // a release ships them — that is what unblocks retiring the TS toolchain.
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
    // A `.js` payload is the LEGACY npm toolchain and runs under this Node; the native
    // binary is executed directly.
    const result = needsJsRuntime(bin)
        ? spawnSync(process.execPath, [bin, ...args], { stdio: 'inherit' })
        : spawnSync(bin, args, { stdio: 'inherit' });
    if (result.error) {
        console.error(colors.red(`Failed to run opensdk: ${result.error.message}`));
        process.exit(1);
    }
    process.exit(result.status ?? 1);
}
