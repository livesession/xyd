import {execSync, spawn} from 'child_process';
import path from 'path';
import {existsSync, rmSync} from 'node:fs';

import {findMonorepoRoot, getRandomPort, resolveXydCommand, waitForServer} from './resolve-xyd';

/**
 * Harness for @xyd-js/vite-plugin e2e fixtures: runs the FIXTURE's OWN build
 * (`vite build` / `react-router build` — not `xyd build`; the plugin spawns xyd
 * itself), then serves the merged host outDir statically.
 *
 * Fixtures build IN PLACE (never a temp copy): they are dependency-less apps that
 * resolve `vite`, `react-router` and `@xyd-js/vite-plugin` by Node walk-up through
 * the monorepo's shamefully-hoisted root node_modules — a temp copy has no
 * ancestor node_modules and the walk-up dies. Same mechanism as the
 * xyd-source-react-runtime fixtures.
 */

export interface ViteBuildServerOptions {
    /** Host build output to serve, relative to the fixture. Default "dist" (react-router: "build/client"). */
    outDir?: string;
    /** package.json script that runs the host build. Default "build". */
    buildScript?: string;
    /** Extra env for the build. */
    env?: Record<string, string>;
    /** Build timeout in ms. Default 10 minutes (the docs build inside is heavy). */
    buildTimeout?: number;
}

const FIXTURE_BUILD_ARTIFACTS = ['dist', 'build', '.react-router', path.join('docs', '.xyd')];

function cleanFixture(fixtureDir: string): void {
    for (const rel of FIXTURE_BUILD_ARTIFACTS) {
        rmSync(path.join(fixtureDir, rel), {recursive: true, force: true});
    }
}

/**
 * The e2e CI job never builds monorepo packages — compile the plugin on demand.
 * (existsSync guard only: CI runs workers=1; a first-run local race would at worst
 * run tsup twice.)
 */
function ensurePluginBuilt(): void {
    const root = findMonorepoRoot();
    if (!root) return; // no monorepo checkout (published-CLI mode) — the fixture resolves a published plugin instead
    const dist = path.join(root, 'packages/xyd-vite-plugin/dist/index.js');
    if (existsSync(dist)) return;
    console.log('Building @xyd-js/vite-plugin (dist missing)...');
    execSync('pnpm --filter @xyd-js/vite-plugin build', {cwd: root, stdio: 'inherit'});
}

export class ViteBuildServer {
    private process: any;
    private port = 0;
    private readonly fixtureDir: string;
    private readonly options: Required<Pick<ViteBuildServerOptions, 'outDir' | 'buildScript' | 'buildTimeout'>> & ViteBuildServerOptions;

    constructor(fixtureDir: string, options: ViteBuildServerOptions = {}) {
        this.fixtureDir = path.resolve(fixtureDir);
        this.options = {
            outDir: options.outDir || 'dist',
            buildScript: options.buildScript || 'build',
            buildTimeout: options.buildTimeout || 10 * 60 * 1000,
            env: options.env,
        };
    }

    async start(): Promise<void> {
        ensurePluginBuilt();
        cleanFixture(this.fixtureDir);

        // The plugin's `command` option gets the tier-resolved CLI argv (WITHOUT the
        // `build` subcommand — the plugin appends it); XYD_DEV_MODE etc. flow through
        // the environment into the spawned docs build.
        const resolved = await resolveXydCommand();
        const env = {
            ...process.env,
            ...resolved.env,
            ...this.options.env,
            XYD_E2E_CLI_CMD: JSON.stringify([resolved.cmd, ...resolved.args]),
        };

        console.log(`Running host build (pnpm run ${this.options.buildScript}) in ${this.fixtureDir}...`);
        execSync(`pnpm run ${this.options.buildScript}`, {
            cwd: this.fixtureDir,
            stdio: 'inherit',
            timeout: this.options.buildTimeout,
            env,
        });

        this.port = await getRandomPort();
        const serveDir = path.join(this.fixtureDir, this.options.outDir);
        console.log(`Serving merged build (${serveDir}) on port ${this.port}`);
        this.process = spawn('npx', ['serve', '-l', this.port.toString(), serveDir], {
            cwd: this.fixtureDir,
            stdio: 'inherit',
        });

        await waitForServer(this.port);
    }

    async stop(): Promise<void> {
        if (this.process) {
            this.process.kill('SIGTERM');
            await new Promise((resolve) => this.process.on('close', resolve));
        }
        cleanFixture(this.fixtureDir);
    }

    getUrl(urlPath: string = ''): string {
        return `http://localhost:${this.port}${urlPath}`;
    }

    getOutDir(): string {
        return path.join(this.fixtureDir, this.options.outDir);
    }
}

export async function createViteBuildServer(fixtureDir: string, options: ViteBuildServerOptions = {}): Promise<ViteBuildServer> {
    const server = new ViteBuildServer(fixtureDir, options);
    await server.start();
    return server;
}
