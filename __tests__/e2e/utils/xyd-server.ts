import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';
import path from 'path';

export interface XydServerOptions {
  port?: number;
  testDir?: string;
  timeout?: number;
}

export class XydServer {
  private process: any;
  private port: number;
  private testDir: string;

  constructor(options: XydServerOptions = {}) {
    this.port = options.port || 3001;
    this.testDir = options.testDir || process.cwd();
  }

  async start(): Promise<void> {
    // Start XYD server in dev mode from the test directory
    this.process = spawn('xyd', ['-p', this.port.toString()], {
      env: {
        ...process.env,
        XYD_DEV_MODE: '1'
      },
      cwd: this.testDir,
      stdio: 'pipe'
    });

    // Wait for server to start
    await setTimeout(5000);

    // Check if server is running
    try {
      const response = await fetch(`http://localhost:${this.port}`);
      if (!response.ok) {
        throw new Error(`Server not ready: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to start XYD server:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill('SIGTERM');
      await new Promise(resolve => this.process.on('close', resolve));
    }
  }

  getUrl(path: string = ''): string {
    return `http://localhost:${this.port}${path}`;
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