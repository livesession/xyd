import {execSync, spawn} from 'child_process';
import path from 'path';
import {existsSync, rmSync} from 'node:fs';

import {findMonorepoRoot, getRandomPort, resolveXydCommand, waitForServer} from './resolve-xyd';

/**
 * Harness for the @xyd-js/vite-plugin COMPAT fixtures (10.webframeworks-plugin):
 * unlike the main suite's dependency-less fixtures (which ride the monorepo's
 * hoisted versions), each compat fixture pins its OWN vite/framework versions in
 * package.json and installs them with npm — `@xyd-js/vite-plugin` resolves via a
 * relative `file:` dep pointing at packages/xyd-vite-plugin (npm symlinks it).
 *
 * Serving is fixture-shaped: static hosts use `npx serve` over an outDir; the
 * vite-SSR-guide fixtures run their OWN express server (`npm run <script>` with
 * PORT/NODE_ENV), in dev too (vite in middlewareMode inside server.js).
 */

export interface CompatFixture {
    dir: string;
    build: {
        /** outDir served with `npx serve` (static fixtures) … */
        outDir?: string;
        /** …or a package.json script that serves the built app itself (PORT env). */
        serveScript?: string;
        /** extra env for the serve script (e.g. NODE_ENV=production). */
        serveEnv?: Record<string, string>;
    };
    dev: {
        /** package.json dev script. Default "dev". */
        script?: string;
        /** env var the fixture reads its http port from. Default XYD_E2E_HOST_PORT (vite config); SSR templates use PORT. */
        portEnvVar?: string;
    };
}

const BUILD_ARTIFACTS = [
    'dist', 'build', '.react-router', '.svelte-kit', '.astro', '.nuxt', '.output', '.next',
    path.join('docs', '.xyd'),
    // @xyd-js/next-plugin generates into public/ (Next serves it at the root)
    path.join('public', 'docs'), path.join('public', 'assets'), path.join('public', 'public'),
    path.join('public', '.xyd-docs-manifest.json'),
];

function clean(fixtureDir: string): void {
    for (const rel of BUILD_ARTIFACTS) {
        rmSync(path.join(fixtureDir, rel), {recursive: true, force: true});
    }
}

function ensurePluginBuilt(): void {
    const root = findMonorepoRoot();
    if (!root) return;
    for (const pkg of ['xyd-vite-plugin', 'xyd-next-plugin']) {
        const dist = path.join(root, `packages/${pkg}/dist/index.js`);
        if (existsSync(dist)) continue;
        console.log(`Building @xyd-js/${pkg.replace('xyd-', '')} (dist missing)...`);
        execSync(`pnpm --filter @xyd-js/${pkg.replace('xyd-', '')} build`, {cwd: root, stdio: 'inherit'});
    }
}

/** npm install once per fixture (node_modules kept across runs as a cache). */
function ensureInstalled(fixtureDir: string): void {
    if (existsSync(path.join(fixtureDir, 'node_modules'))) return;
    console.log(`Installing compat fixture deps (npm) in ${fixtureDir}...`);
    execSync('npm install --no-audit --no-fund --loglevel=error', {
        cwd: fixtureDir,
        stdio: 'inherit',
        timeout: 10 * 60 * 1000,
    });
}

async function harnessEnv(fixtureDir: string, port: number, portEnvVar: string, extra?: Record<string, string>): Promise<NodeJS.ProcessEnv> {
    const resolved = await resolveXydCommand();
    return {
        ...process.env,
        ...resolved.env,
        ...extra,
        [portEnvVar]: port.toString(),
        // listhen-based dev servers (nuxt) bind `localhost` to a per-run IPv4 OR
        // IPv6 — pin them to IPv4 so getUrl's 127.0.0.1 always connects
        HOST: '127.0.0.1',
        // NOTE the dev-mode docs builds share the monorepo's .xyd/host (an explicit
        // pnpm workspace member — the only way workspace:* host deps install a real
        // node_modules). Per-fixture XYD_HOST isolation was tried and reverted:
        // non-member hosts install hollow (deps hoist to the repo root) and the
        // docs builds then crash on a dual-React useContext error. The shared
        // host's corruption modes are covered instead by the graceful stop() below,
        // the plugin's retry-once, and documan's dangling-symlink fix.
        XYD_E2E_CLI_CMD: JSON.stringify([resolved.cmd, ...resolved.args]),
    };
}

export class CompatServer {
    private process: any;
    private port = 0;
    private readonly fixtureDir: string;
    private readonly fixture: CompatFixture;

    constructor(fixture: CompatFixture) {
        this.fixture = fixture;
        this.fixtureDir = path.resolve(fixture.dir);
    }

    /** `npm run build`, then serve — `npx serve <outDir>` or the fixture's own serve script. */
    async startBuild(): Promise<void> {
        ensurePluginBuilt();
        ensureInstalled(this.fixtureDir);
        clean(this.fixtureDir);

        this.port = await getRandomPort();
        const env = await harnessEnv(this.fixtureDir, this.port, 'PORT', this.fixture.build.serveEnv);

        console.log(`Running compat build (npm run build) in ${this.fixtureDir}...`);
        execSync('npm run build', {cwd: this.fixtureDir, stdio: 'inherit', timeout: 10 * 60 * 1000, env});

        if (this.fixture.build.serveScript) {
            console.log(`Serving via npm run ${this.fixture.build.serveScript} on :${this.port}`);
            this.process = spawn('npm', ['run', this.fixture.build.serveScript], {
                cwd: this.fixtureDir,
                stdio: 'inherit',
                detached: true,
                env,
            });
        } else {
            const serveDir = path.join(this.fixtureDir, this.fixture.build.outDir || 'dist');
            console.log(`Serving ${serveDir} on :${this.port}`);
            this.process = spawn('npx', ['serve', '-l', this.port.toString(), serveDir], {
                cwd: this.fixtureDir,
                stdio: 'inherit',
                detached: true,
            });
        }
        await waitForServer(this.port);
    }

    /** the fixture's own dev script (vite / react-router dev / node server.js). */
    async startDev(): Promise<void> {
        ensurePluginBuilt();
        ensureInstalled(this.fixtureDir);
        clean(this.fixtureDir);

        this.port = await getRandomPort();
        const portEnvVar = this.fixture.dev.portEnvVar || 'XYD_E2E_HOST_PORT';
        const env = await harnessEnv(this.fixtureDir, this.port, portEnvVar);

        const script = this.fixture.dev.script || 'dev';
        console.log(`Running compat dev (npm run ${script}) in ${this.fixtureDir} on :${this.port}...`);
        this.process = spawn('npm', ['run', script], {
            cwd: this.fixtureDir,
            stdio: 'inherit',
            detached: true, // own process group — stop() signals the whole chain
            env,
        });
        await waitForServer(this.port);
    }

    async stop(): Promise<void> {
        if (this.process?.pid) {
            const pgid = -this.process.pid;
            try { process.kill(pgid, 'SIGTERM'); } catch { /* gone */ }
            // give the tree up to 10s to die gracefully (a SIGKILL mid-install
            // leaves the fixture's xyd host workspace corrupted)
            for (let i = 0; i < 20; i++) {
                await new Promise((r) => setTimeout(r, 500));
                try { process.kill(pgid, 0); } catch { return; } // group gone
            }
            try { process.kill(pgid, 'SIGKILL'); } catch { /* gone */ }
        }
        // build output is intentionally LEFT on disk for inspection — every run
        // starts from a clean() in startBuild()/startDev() anyway
    }

    getUrl(urlPath: string = ''): string {
        // 127.0.0.1, not localhost: playwright's apiRequestContext resolves
        // localhost to ::1 while some dev servers (nuxt) bind IPv4 only
        return `http://127.0.0.1:${this.port}${urlPath}`;
    }
}
