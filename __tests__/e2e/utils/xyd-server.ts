import {spawn} from 'child_process';
import {setTimeout} from 'timers/promises';
import path from 'path';
import fs, {existsSync, mkdtempSync, rmSync, cpSync} from 'node:fs';
import {tmpdir} from 'node:os';

export interface XydServerOptions {
    port?: number;
    testDir?: string;
    timeout?: number;
    templateDir?: string;
}

export class XydServer {
    private process: any;
    private port: number;
    private testDir: string;
    private tempDir?: string;
    private templateDir?: string;

    constructor(options: XydServerOptions = {}) {
        this.port = options.port || 3001;
        this.testDir = options.testDir || process.cwd();
        this.templateDir = options.templateDir;
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
        // Create temporary workspace if template directory is provided
        if (this.templateDir) {
            this.tempDir = this.createTempWorkspace();
            this.testDir = this.tempDir;
        }

        // Start XYD server in dev mode from the test directory
        this.process = spawn('xyd', ['-p', this.port.toString()], {
            env: {
                ...process.env,
            },
            cwd: this.testDir,
            stdio: 'inherit'
        });

        // Wait for server to start with max 2 minutes timeout, checking every 5 seconds
        const maxWaitTime = 2 * 60 * 1000; // 2 minutes
        const checkInterval = 5 * 1000; // 5 seconds
        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitTime) {
            try {
                const response = await fetch(`http://localhost:${this.port}`);
                if (response.ok) {
                    console.log(`✅ XYD server started successfully on port ${this.port}`);
                    return;
                }
            } catch (error) {
                // Server not ready yet, continue waiting
            }
            
            await setTimeout(checkInterval);
        }

        // If we get here, the server didn't start within the timeout
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