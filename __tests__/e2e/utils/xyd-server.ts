import {spawn, execSync} from 'child_process';
import {setTimeout} from 'timers/promises';
import path from 'path';
import net from 'node:net';
import fs, {existsSync, mkdtempSync, rmSync, cpSync} from 'node:fs';
import {tmpdir} from 'node:os';

function getRandomPort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const srv = net.createServer();
        srv.listen(0, () => {
            const port = (srv.address() as net.AddressInfo).port;
            srv.close(() => resolve(port));
        });
        srv.on('error', reject);
    });
}

export interface XydServerOptions {
    port?: number;
    testDir?: string;
    timeout?: number;
    templateDir?: string;
    /** "dev" = xyd dev server, "build" = xyd build + xyd serve */
    mode?: "dev" | "build";
    /** Extra env vars passed to xyd process */
    env?: Record<string, string>;
}

interface ResolvedCommand {
    cmd: string;
    args: string[];
    env: Record<string, string>;
}

export class XydServer {
    private process: any;
    private port: number;
    private testDir: string;
    private tempDir?: string;
    private templateDir?: string;
    private mode: "dev" | "build";
    private extraEnv: Record<string, string>;

    constructor(options: XydServerOptions = {}) {
        this.port = options.port || 0; // 0 = auto-assign a free port
        this.testDir = options.testDir || process.cwd();
        this.templateDir = options.templateDir;
        this.mode = options.mode || "dev";
        this.extraEnv = options.env || {};
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

    private async resolveXydCommand(): Promise<ResolvedCommand> {
        const testVersion = process.env.XYD_LOCAL_TEST_VERSION;

        // Priority 1: specific npm version — installed to an isolated directory
        // so it never leaks into or resolves from the monorepo's node_modules
        if (testVersion) {
            const installDir = path.join(tmpdir(), `xyd-isolated-${testVersion}`);
            const doneMarker = path.join(installDir, '.installed');
            const lockDir = path.join(installDir, '.installing');

            if (!existsSync(doneMarker)) {
                fs.mkdirSync(installDir, { recursive: true });
                let acquiredLock = false;
                try {
                    // Atomic lock: only one process can create this directory
                    fs.mkdirSync(lockDir);
                    acquiredLock = true;
                } catch {}

                if (acquiredLock) {
                    console.log(`Installing xyd-js@${testVersion} to ${installDir}...`);
                    execSync(`npm install --prefix ${installDir} xyd-js@${testVersion}`, { stdio: 'inherit' });
                    fs.writeFileSync(doneMarker, '');
                    fs.rmdirSync(lockDir);
                } else {
                    // Another worker is installing — wait for it
                    console.log(`Waiting for xyd-js@${testVersion} install by another worker...`);
                    while (!existsSync(doneMarker)) {
                        execSync('sleep 1');
                    }
                }
            }
            const xydEntry = path.join(installDir, 'node_modules', 'xyd-js', 'index.js');
            return { cmd: 'node', args: [xydEntry], env: {} };
        }

        // Priority 2: monorepo local CLI
        const monorepoRoot = this.findMonorepoRoot();
        if (monorepoRoot) {
            const cliPath = path.join(monorepoRoot, 'packages/xyd-cli/dist/index.js');
            console.log(`Using monorepo CLI: ${cliPath}`);
            return {
                cmd: 'node',
                args: [cliPath],
                env: { XYD_DEV_MODE: '1', XYD_NODE_PM: 'pnpm' },
            };
        }

        // Priority 3: global xyd
        return { cmd: 'xyd', args: [], env: {} };
    }

    private findMonorepoRoot(): string | null {
        // Walk up from __tests__/e2e/utils/ to repo root
        const dir = path.resolve(__dirname, '../../..');
        const cliPath = path.join(dir, 'packages/xyd-cli/dist/index.js');
        if (existsSync(cliPath)) return dir;
        return null;
    }

    private async startDev(env: Record<string, string>): Promise<void> {
        const resolved = await this.resolveXydCommand();
        this.process = spawn(resolved.cmd, [...resolved.args, '-p', this.port.toString()], {
            env: { ...env, ...resolved.env },
            cwd: this.testDir,
            stdio: 'inherit'
        });

        await this.waitForServer();
    }

    private async buildAndServe(env: Record<string, string>): Promise<void> {
        const resolved = await this.resolveXydCommand();

        // Step 1: run xyd build
        console.log(`Running xyd build in ${this.testDir}...`);
        const buildProcess = spawn(resolved.cmd, [...resolved.args, 'build'], {
            env: { ...env, ...resolved.env },
            cwd: this.testDir,
            stdio: 'inherit'
        });

        const buildExitCode = await new Promise<number>((resolve) => {
            buildProcess.on('close', (code: number) => resolve(code ?? 1));
        });

        if (buildExitCode !== 0) {
            throw new Error(`xyd build failed with exit code ${buildExitCode}`);
        }
        console.log(`xyd build completed`);

        // Step 2: start xyd serve (or node server.mjs if it exists)
        const serverMjs = path.join(this.testDir, '.xyd', 'build', 'client', 'server.mjs');
        const buildClientDir = path.join(this.testDir, '.xyd', 'build', 'client');
        if (existsSync(serverMjs)) {
            console.log(`Starting edge server (server.mjs) on port ${this.port}`);
            this.process = spawn('node', [serverMjs], {
                env: { ...env, ...resolved.env, PORT: this.port.toString() },
                cwd: this.testDir,
                stdio: 'inherit'
            });
        } else {
            console.log(`Serving static build on port ${this.port}`);
            this.process = spawn('npx', ['serve', '-l', this.port.toString(), buildClientDir], {
                env: { ...env, ...resolved.env },
                cwd: this.testDir,
                stdio: 'inherit'
            });
        }

        await this.waitForServer();
    }

    private async waitForServer(): Promise<void> {
        const maxWaitTime = 2 * 60 * 1000; // 2 minutes
        const checkInterval = 5 * 1000; // 5 seconds
        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitTime) {
            try {
                const response = await fetch(`http://localhost:${this.port}`);
                if (response.ok || response.status === 302) {
                    console.log(`✅ Server started successfully on port ${this.port}`);
                    return;
                }
            } catch (error) {
                // Server not ready yet, continue waiting
            }

            await setTimeout(checkInterval);
        }

        throw new Error(`Server failed to start on port ${this.port} within 2 minutes`);
    }

    async stop(): Promise<void> {
        if (this.process) {
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