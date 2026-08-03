import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

// TODO: in the future better build cuz problems with    NODE_ENV: 'production',
export async function build() {
    // Opt-in Bun engine (S3): static site generation without Vite/React Router.
    // Gated on XYD_BUN during migration; the Vite build below stays the default.
    if (process.env.XYD_BUN) {
        return buildBun();
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const buildScript = join(__dirname, '..', 'dist', 'build.js');

    return new Promise((resolve, reject) => {
        const args = process.argv.slice(2); // Get all arguments passed to the script
        const child = spawn('node', [buildScript, ...args], {
            stdio: 'inherit', // This will show output in stdout
            shell: true,
            env: {
                NODE_ENV: 'production',
                ...process.env, // Pass through all existing environment variables
            }
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve(undefined);
            } else {
                reject(new Error(`Build process exited with code ${code}`));
            }
        });

        child.on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Spawn the Bun static build. The CLI runs under node; the build launcher is TSX
 * only Bun can run — spawn a bun child on @xyd-js/documan/bun-build-launcher.
 */
async function buildBun() {
    // Compiled binary (S4.2): the binary IS bun — run the engine in-process.
    // There's no external bun to spawn and no on-disk launcher to resolve. The
    // literal specifier lets `bun --compile` bundle the whole engine graph in.
    if ((globalThis as any).__xydCompiledBinary) {
        const { buildStatic } = await import('@xyd-js/documan/bun-engine');
        await buildStatic(process.cwd());
        return;
    }

    const probe = spawnSync('bun', ['--version'], { stdio: 'ignore' });
    if (probe.status !== 0) {
        console.error('XYD_BUN is set but Bun is not on PATH. Install Bun: https://bun.sh');
        process.exit(1);
    }

    const require = createRequire(import.meta.url);
    let launcher: string;
    try {
        launcher = require.resolve('@xyd-js/documan/bun-build-launcher');
    } catch (e) {
        console.error('Could not resolve @xyd-js/documan/bun-build-launcher:', (e as any)?.message);
        process.exit(1);
        return;
    }

    await new Promise<void>((resolve, reject) => {
        const child = spawn('bun', [launcher], {
            stdio: 'inherit',
            cwd: process.cwd(),
            env: { ...process.env, NODE_ENV: 'production', XYD_BUN: '1' },
        });
        child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`xyd build (bun) exited ${code}`))));
        child.on('error', reject);
    });
}
