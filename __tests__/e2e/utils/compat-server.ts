import {execSync, spawn} from 'child_process';
import path from 'path';
import {existsSync, rmSync} from 'node:fs';

import {findMonorepoRoot, getRandomPort, resolveXydCommand, waitForServer} from './resolve-xyd';

/**
 * Harness for the @xyd-js/vite-plugin COMPAT fixtures (11.vite-plugin-compat):
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

const BUILD_ARTIFACTS = ['dist', 'build', '.react-router', path.join('docs', '.xyd')];

function clean(fixtureDir: string): void {
    for (const rel of BUILD_ARTIFACTS) {
        rmSync(path.join(fixtureDir, rel), {recursive: true, force: true});
    }
}

function ensurePluginBuilt(): void {
    const root = findMonorepoRoot();
    if (!root) return;
    const dist = path.join(root, 'packages/xyd-vite-plugin/dist/index.js');
    if (existsSync(dist)) return;
    console.log('Building @xyd-js/vite-plugin (dist missing)...');
    execSync('pnpm --filter @xyd-js/vite-plugin build', {cwd: root, stdio: 'inherit'});
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

async function harnessEnv(port: number, portEnvVar: string, extra?: Record<string, string>): Promise<NodeJS.ProcessEnv> {
    const resolved = await resolveXydCommand();
    return {
        ...process.env,
        ...resolved.env,
        ...extra,
        [portEnvVar]: port.toString(),
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
        const env = await harnessEnv(this.port, 'PORT', this.fixture.build.serveEnv);

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
        const env = await harnessEnv(this.port, portEnvVar);

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
            try { process.kill(-this.process.pid, 'SIGTERM'); } catch { /* gone */ }
            await new Promise((r) => setTimeout(r, 2000));
            try { process.kill(-this.process.pid, 'SIGKILL'); } catch { /* gone */ }
        }
        clean(this.fixtureDir);
    }

    getUrl(urlPath: string = ''): string {
        return `http://localhost:${this.port}${urlPath}`;
    }
}
