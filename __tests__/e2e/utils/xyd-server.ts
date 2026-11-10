import {spawn, type ChildProcess} from 'node:child_process';
import path from 'path';
import {existsSync, mkdtempSync, rmSync, cpSync} from 'node:fs';
import {tmpdir} from 'node:os';

import {getRandomPort, resolveXydCommand, waitForServer, type ResolvedCommand} from './resolve-xyd';

export interface XydServerOptions {
    port?: number;
    testDir?: string;
    timeout?: number;
    templateDir?: string;
    /** "dev" = xyd dev server, "build" = xyd build + xyd serve */
    mode?: "dev" | "build";
    /** Extra env vars passed to xyd process */
    env?: Record<string, string>;
    /**
     * Extra CLI arguments, placed right after the command: `xyd build <...args>`
     * in build mode, `xyd dev <...args> -p <port>` in dev mode — e.g. the
     * positional document of the fast-serve mode (`['./openapi.yaml']`). The
     * `dev` is spelled out only when there are extra args: the CLI reads the
     * first positional as the command (a bare `xyd ./openapi.yaml -p <port>` is
     * `Unknown command: ./openapi.yaml`); without them the existing
     * `xyd -p <port>` form stays (`dev` is the CLI's default command).
     * Readiness is `GET /` answering 200/302 (waitForServer): a project mounted
     * under `advanced.basename` answers 404 there in dev mode, so such a
     * project is tested in build mode (the static server lists the root).
     */
    args?: string[];
}

/**
 * The dev server's argv after the CLI's own: `dev <...args> -p <port>` when
 * there are extra args (the CLI takes the first positional as the command, so
 * the document of the fast-serve mode needs `dev` in front of it), the bare
 * `-p <port>` otherwise — the CLI's default command is `dev`, and the existing
 * callers rely on that form.
 */
export function devArgs(args: string[], port: number): string[] {
    return [...(args.length ? ['dev', ...args] : []), '-p', port.toString()];
}

export class XydServer {
    private process: any;
    private port: number;
    private testDir: string;
    private tempDir?: string;
    private templateDir?: string;
    private mode: "dev" | "build";
    private extraEnv: Record<string, string>;
    private args: string[];

    constructor(options: XydServerOptions = {}) {
        this.port = options.port || 0; // 0 = auto-assign a free port
        this.testDir = options.testDir || process.cwd();
        this.templateDir = options.templateDir;
        this.mode = options.mode || "dev";
        this.extraEnv = options.env || {};
        this.args = options.args || [];
    }

    /**
     * A copy of `projectDir` outside the repository, at the same path relative
     * to a fresh root, with the shared `__tests__/__fixtures__` beside it — so
     * the project's relative references (`../../../__fixtures__/openapi/…`) still
     * resolve. A project outside the repository is used where it is.
     */
    private createOutOfRepoWorkspace(projectDir: string): string {
        const repoRoot = path.resolve(__dirname, '../../..');
        const relative = path.relative(repoRoot, projectDir);
        if (relative.startsWith('..') || path.isAbsolute(relative)) {
            return projectDir;
        }
        const root = mkdtempSync(path.join(tmpdir(), 'xyd-e2e-'));
        const target = path.join(root, relative);
        const skip = (src: string) => {
            const name = path.basename(src);
            return name === '.xyd' || name === 'node_modules';
        };
        cpSync(projectDir, target, { recursive: true, filter: (src) => !skip(src) });
        const fixtures = path.join(repoRoot, '__tests__', '__fixtures__');
        if (existsSync(fixtures)) {
            cpSync(fixtures, path.join(root, '__tests__', '__fixtures__'), { recursive: true });
        }
        this.tempDir = root;
        console.log(`📁 Running ${relative} from ${target} (outside the repository)`);
        return target;
    }

    private createTempWorkspace(): string {
        const tempDir = mkdtempSync(path.join(tmpdir(), `xyd-server-test-`));
        console.log(`📁 Created temporary workspace: ${tempDir}`);

        if (this.templateDir) {
            // Copy template directory to temporary location, ignoring .xyd folder
            cpSync(this.templateDir, tempDir, {
                recursive: true,
                filter: (src, dest) => {
                    // Ignore .xyd folder and its contents
                    if (src.includes('.xyd')) {
                        return false;
                    }
                    return true;
                }
            });
            console.log(`📋 Copied template from ${this.templateDir} to ${tempDir} (ignoring .xyd folder)`);
        }

        return tempDir;
    }

    private cleanupTempWorkspace(): void {
        if (this.tempDir) {
            try {
                rmSync(this.tempDir, {recursive: true, force: true});
                console.log(`🧹 Cleaned up temporary workspace: ${this.tempDir}`);
            } catch (error) {
                console.warn(`⚠️ Failed to cleanup temporary workspace ${this.tempDir}:`, error);
            }
        }
    }

    async start(): Promise<void> {
        // Auto-assign a free port if not specified
        if (this.port === 0) {
            this.port = await getRandomPort();
        }

        this.resolved = await resolveXydCommand();

        // A CLI other than the monorepo's own build (an installed release, a
        // pinned version) must not run a project in place: inside this
        // repository, module resolution walks up to the root node_modules, where
        // `pnpm i` links every workspace @xyd-js package — unbuilt ones included —
        // ahead of the CLI's own, and a theme found there "is installed" but has
        // no entry to bundle. Run a copy outside the repository instead, the way a
        // user's project runs.
        if (!this.templateDir && this.resolved.source !== 'monorepo') {
            this.testDir = this.createOutOfRepoWorkspace(this.testDir);
        }

        // Create temporary workspace if template directory is provided
        if (this.templateDir) {
            this.tempDir = this.createTempWorkspace();
            this.testDir = this.tempDir;
        }

        const env = { ...process.env, ...this.extraEnv };

        if (this.mode === "build") {
            await this.buildAndServe(env);
        } else {
            await this.startDev(env);
        }
    }

    private resolved?: ResolvedCommand;

    private async startDev(env: Record<string, string>): Promise<void> {
        const resolved = this.resolved ?? (await resolveXydCommand());
        this.process = this.spawnLogged('xyd dev', resolved.cmd, [...resolved.args, ...devArgs(this.args, this.port)], {
            env: { ...env, ...resolved.env },
            cwd: this.testDir,
        });

        await this.waitForServer();
    }

    private async buildAndServe(env: Record<string, string>): Promise<void> {
        const resolved = this.resolved ?? (await resolveXydCommand());

        // Step 1: run xyd build
        console.log(`Running xyd build in ${this.testDir}...`);
        const buildProcess = this.spawnLogged('xyd build', resolved.cmd, [...resolved.args, 'build', ...this.args], {
            env: { ...env, ...resolved.env },
            cwd: this.testDir,
        });

        const buildExitCode = await new Promise<number>((resolve) => {
            buildProcess.on('close', (code: number) => resolve(code ?? 1));
        });

        if (buildExitCode !== 0) {
            throw new Error(`xyd build failed with exit code ${buildExitCode}:\n${this.outputTail()}`);
        }
        console.log(`xyd build completed`);

        // Step 2: start xyd serve (or node server.mjs if it exists)
        const serverMjs = path.join(this.testDir, '.xyd', 'build', 'client', 'server.mjs');
        const buildClientDir = path.join(this.testDir, '.xyd', 'build', 'client');
        if (existsSync(serverMjs)) {
            console.log(`Starting edge server (server.mjs) on port ${this.port}`);
            this.process = this.spawnLogged('server.mjs', 'node', [serverMjs], {
                env: { ...env, ...resolved.env, PORT: this.port.toString() },
                cwd: this.testDir,
            });
        } else {
            console.log(`Serving static build on port ${this.port}`);
            this.process = this.spawnLogged('serve', 'npx', ['serve', '-l', this.port.toString(), buildClientDir], {
                env: { ...env, ...resolved.env },
                cwd: this.testDir,
            });
        }

        await this.waitForServer();
    }

    /** The last output of the spawned processes, for an error message. */
    private output = '';
    private exited?: Promise<never>;

    /**
     * Spawns a process whose output still reaches the console, keeps its tail,
     * and — for the process that serves — remembers its exit, so a server that
     * dies before answering (a bundle that fails, a missing package) fails the
     * start at once, with its own error, instead of after the readiness budget.
     */
    private spawnLogged(label: string, cmd: string, args: string[], options: { env: NodeJS.ProcessEnv; cwd: string }): ChildProcess {
        const child = spawn(cmd, args, { ...options, stdio: ['ignore', 'pipe', 'pipe'] });
        const keep = (chunk: Buffer, to: NodeJS.WriteStream) => {
            to.write(chunk);
            this.output = (this.output + chunk.toString()).slice(-8000);
        };
        child.stdout?.on('data', (chunk: Buffer) => keep(chunk, process.stdout));
        child.stderr?.on('data', (chunk: Buffer) => keep(chunk, process.stderr));
        this.exited = new Promise<never>((_, reject) => {
            child.on('close', (code, signal) => {
                reject(new Error(`${label} exited (${signal ?? code}) before serving on port ${this.port}:\n${this.outputTail()}`));
            });
        });
        // Only a rejection that nobody awaits would be unhandled: the start awaits it.
        this.exited.catch(() => undefined);
        return child;
    }

    private outputTail(): string {
        // biome-ignore lint/suspicious/noControlCharactersInRegex: strips terminal colour codes
        return this.output.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '').split('\n').slice(-40).join('\n');
    }

    private async waitForServer(): Promise<void> {
        return waitForServer(this.port, this.exited);
    }

    async stop(): Promise<void> {
        if (this.process && this.process.exitCode === null && this.process.signalCode === null) {
            this.process.kill('SIGTERM');
            await new Promise(resolve => this.process.on('close', resolve));
        }
        
        // Clean up temporary workspace
        this.cleanupTempWorkspace();
    }

    getUrl(path: string = ''): string {
        return `http://localhost:${this.port}${path}`;
    }

    getTempDir(): string | undefined {
        return this.tempDir;
    }
}

// Helper function to create and start a server for a specific test directory
export async function createXydServer(testDirPath: string, options: Omit<XydServerOptions, 'testDir'> = {}): Promise<XydServer> {
    const server = new XydServer({
        ...options,
        testDir: path.resolve(testDirPath)
    });
    await server.start();
    return server;
}

// Helper function to create and start a server with a temporary workspace from a template
export async function createXydServerWithTemplate(templateDir: string, options: Omit<XydServerOptions, 'templateDir'> = {}): Promise<XydServer> {
    const server = new XydServer({
        ...options,
        templateDir: path.resolve(templateDir)
    });
    await server.start();
    return server;
}

// Helper function to create and start a build+serve server with a temporary workspace
export async function createXydBuildServer(templateDir: string, options: Omit<XydServerOptions, 'templateDir' | 'mode'> = {}): Promise<XydServer> {
    const server = new XydServer({
        ...options,
        templateDir: path.resolve(templateDir),
        mode: "build",
    });
    await server.start();
    return server;
}

// Helper: dev server on the NEW Rust+bun engine (XYD_BUN=1). Use for features
// that only ship on the bun engine (the Vite/React-Router path is deprecating).
export async function createXydBunServer(testDirPath: string, options: Omit<XydServerOptions, 'testDir'> = {}): Promise<XydServer> {
    const server = new XydServer({
        ...options,
        testDir: path.resolve(testDirPath),
        env: { XYD_BUN: '1', ...(options.env || {}) },
    });
    await server.start();
    return server;
}
