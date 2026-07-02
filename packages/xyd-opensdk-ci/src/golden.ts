import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Golden file-map fixture primitives shared by every emitter package's tests.

/** Read a directory tree into a `{ relativePath: contents }` map. */
export function listFiles(dir: string, base = dir): Record<string, string> {
  const out: Record<string, string> = {};
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) Object.assign(out, listFiles(full, base));
    else out[path.relative(base, full).split(path.sep).join('/')] = fs.readFileSync(full, 'utf8');
  }
  return out;
}

/** Replace a directory tree with a generated file map. */
export function writeTree(dir: string, files: Record<string, string>): void {
  fs.rmSync(dir, { recursive: true, force: true });
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
}

/** Whether a toolchain command is available (e.g. `go`, `python3`). */
export function hasCommand(probe: string): boolean {
  try {
    execSync(probe, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
