import {execSync} from 'child_process';
import {setTimeout as sleep} from 'timers/promises';
import path from 'path';
import net from 'node:net';
import fs, {existsSync} from 'node:fs';
import {tmpdir} from 'node:os';

/**
 * Shared pieces of the e2e harness: which xyd CLI to run (3-tier resolution),
 * free-port allocation and server-readiness polling. Used by XydServer
 * (xyd-server.ts) and ViteBuildServer (vite-build-server.ts).
 */

export interface ResolvedCommand {
    cmd: string;
    args: string[];
    env: Record<string, string>;
}

export function getRandomPort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const srv = net.createServer();
        srv.listen(0, () => {
            const port = (srv.address() as net.AddressInfo).port;
            srv.close(() => resolve(port));
        });
        srv.on('error', reject);
    });
}

/** Monorepo root (walking up from __tests__/e2e/utils/) when the local CLI dist exists. */
export function findMonorepoRoot(): string | null {
    const dir = path.resolve(__dirname, '../../..');
    const cliPath = path.join(dir, 'packages/xyd-cli/dist/index.js');
    if (existsSync(cliPath)) return dir;
    return null;
}

/**
 * Which xyd CLI should tests run? Priority:
 *  1. XYD_LOCAL_TEST_VERSION — that npm version, installed once to an isolated tmp dir
 *  2. the monorepo's local CLI (packages/xyd-cli/dist) with XYD_DEV_MODE
 *  3. a global `xyd` on PATH
 */
export async function resolveXydCommand(): Promise<ResolvedCommand> {
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
    const monorepoRoot = findMonorepoRoot();
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

/** Poll http://localhost:<port> until it answers 200/302 (2 min budget). */
export async function waitForServer(port: number): Promise<void> {
    const maxWaitTime = 2 * 60 * 1000; // 2 minutes
    const checkInterval = 5 * 1000; // 5 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
        try {
            const response = await fetch(`http://localhost:${port}`);
            if (response.ok || response.status === 302) {
                console.log(`✅ Server started successfully on port ${port}`);
                return;
            }
        } catch (error) {
            // Server not ready yet, continue waiting
        }

        await sleep(checkInterval);
    }

    throw new Error(`Server failed to start on port ${port} within 2 minutes`);
}
