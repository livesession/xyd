import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Node-style resolution by filesystem walk: is `pkg` reachable — and usable —
 * in a node_modules from `fromDir` upward? Pure `fs` (handles pnpm symlinks +
 * workspace hoisting) so it does NOT touch Bun's resolver cache — a failed
 * `Bun.resolveSync` here would poison the negative cache and make the later
 * Bun.build fail to resolve the package even after it is installed.
 *
 * The FIRST copy found is the one the bundler resolves, so it decides: a copy
 * without its entry file (a workspace package linked into an enclosing
 * node_modules but never built) is "not installed", and installing one into the
 * host puts a usable copy nearer than it.
 */
export function pkgInstalled(fromDir: string, pkg: string): boolean {
  const segs = pkg.split("/");
  let dir = fromDir;
  for (;;) {
    const pkgDir = path.join(dir, "node_modules", ...segs);
    const manifest = path.join(pkgDir, "package.json");
    if (fs.existsSync(manifest)) return hasEntry(pkgDir, manifest);
    const parent = path.dirname(dir);
    if (parent === dir) return false;
    dir = parent;
  }
}

/** Whether the package's entry (exports ".", else module, else main) exists on disk. */
function hasEntry(pkgDir: string, manifest: string): boolean {
  let pkg: any;
  try {
    pkg = JSON.parse(fs.readFileSync(manifest, "utf8"));
  } catch {
    return false;
  }
  const target = exportTarget(pkg.exports) ?? pkg.module ?? pkg.main ?? "index.js";
  return typeof target === "string" && fs.existsSync(path.join(pkgDir, target));
}

function exportTarget(exp: unknown): string | undefined {
  if (typeof exp === "string") return exp;
  if (Array.isArray(exp)) {
    for (const item of exp) {
      const target = exportTarget(item);
      if (target) return target;
    }
    return undefined;
  }
  if (!exp || typeof exp !== "object") return undefined;
  const map = exp as Record<string, unknown>;
  if (Object.keys(map).some((key) => key.startsWith("."))) return exportTarget(map["."]);
  for (const condition of ["bun", "browser", "import", "module", "node", "default", "require"]) {
    const target = exportTarget(map[condition]);
    if (target) return target;
  }
  return undefined;
}
