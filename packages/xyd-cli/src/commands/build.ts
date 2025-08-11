import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// TODO: in the future better build cuz problems with    NODE_ENV: 'production',
export async function build() {
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
