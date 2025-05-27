import * as documan from "@xyd-js/documan"
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

export async function build(root: string, options: any = {}) {
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

export async function dev(root: string, options: any = {}) {
    await documan.dev()

    // keep `xyd dev` alive
    await new Promise(() => {
    });
}