import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createServer } from 'node:http';

/**
 * `xyd serve` — Serve the built site in production mode.
 *
 * Automatically detects the deployment mode from docs.json:
 * - edge.platform: "node" → runs the auto-generated server.mjs (with JWT verification, access control)
 * - No edge config → serves static files from .xyd/build/client/
 */
export async function serve() {
    const cwd = process.cwd();
    const buildDir = join(cwd, '.xyd/build/client');
    const serverPath = join(buildDir, 'server.mjs');

    if (!existsSync(buildDir)) {
        console.error('❌ Build not found. Run `xyd build` first.');
        process.exit(1);
    }

    // Check if an edge server was generated
    if (existsSync(serverPath)) {
        console.log('🔒 Starting access-control server...\n');

        return new Promise((resolve, reject) => {
            const child = spawn('node', [serverPath], {
                stdio: 'inherit',
                shell: true,
                env: {
                    ...process.env,
                    NODE_ENV: process.env.NODE_ENV || 'production',
                },
            });

            child.on('close', (code) => {
                if (code === 0) resolve(undefined);
                else reject(new Error(`Server exited with code ${code}`));
            });

            child.on('error', reject);
        });
    }

    // No edge server — serve static files directly
    const port = parseInt(process.env.PORT || '3000', 10);

    const mimeTypes: Record<string, string> = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
    };

    const { extname } = await import('node:path');

    const server = createServer((req, res) => {
        let pathname = new URL(req.url || '/', `http://localhost:${port}`).pathname;

        // Try to find the file
        let filePath = join(buildDir, pathname);

        if (!existsSync(filePath) || !filePath.includes('.')) {
            // Try index.html
            const indexPath = join(buildDir, pathname, 'index.html');
            if (existsSync(indexPath)) {
                filePath = indexPath;
            } else {
                // SPA fallback
                filePath = join(buildDir, 'index.html');
            }
        }

        if (!existsSync(filePath)) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }

        const ext = extname(filePath);
        const mime = mimeTypes[ext] || 'application/octet-stream';

        try {
            const content = readFileSync(filePath);
            res.writeHead(200, { 'Content-Type': mime });
            res.end(content);
        } catch {
            res.writeHead(500);
            res.end('Error');
        }
    });

    server.listen(port, () => {
        console.log(`\n  📄 Serving static site at http://localhost:${port}`);
        console.log(`  Directory: ${buildDir}\n`);
    });
}