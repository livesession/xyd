import fs from "node:fs";
import path from "node:path";

/**
 * Post-build shaping of `.xyd/build/client` for the Vite engine — pure fs
 * helpers with no Vite/documan imports, so they are unit-testable in isolation
 * (see __tests__/buildOutput.test.ts).
 *
 * Output anatomy with `advanced.basename: "/docs"` (the default Vite `base`
 * is derived from it, so every asset URL carries the prefix too):
 *
 *   client/
 *     .vite/                      build metadata, not servable
 *     docs/                       the whole site — self-contained, mount it at /docs
 *       index.html                the landing page (stays index.html, never docs.html)
 *       <page>.html, <page>.data  one per route (flattened from <page>/index.html)
 *       <page>.md, llms.txt       the raw routes
 *       assets/                   hashed js/css/fonts, referenced as /docs/assets/*
 *       __spa-fallback.html       the SPA shell for non-prerendered paths
 *
 * Without a basename nothing moves: assets/ and __spa-fallback.html stay at the
 * client root next to the pages, exactly as before.
 */

/** `advanced.basename` as the Vite `base` it implies: `/docs` → `/docs/`; none → undefined. */
export function basenameViteBase(basename?: string | null): string | undefined {
    const trimmed = (basename || "").replace(/^\/+|\/+$/g, "");
    return trimmed ? `/${trimmed}/` : undefined;
}

/**
 * Normalize an absolute-path Vite `base` the way Vite does (`/docs` → `/docs/`).
 * URLs and protocol-relative bases are returned untouched — assets served from
 * elsewhere are not something the client tree can hold.
 */
export function normalizePathBase(base: string): string {
    if (!base.startsWith("/") || base.startsWith("//")) {
        return base;
    }
    const trimmed = base.replace(/^\/+|\/+$/g, "");
    return trimmed ? `/${trimmed}/` : "/";
}

/** The basename's directory chain relative to the client root: `/docs/reference` → ["docs", "docs/reference"]. */
export function basenameDirs(basename?: string | null): string[] {
    const segments = (basename || "").split("/").filter(Boolean);
    return segments.map((_, i) => segments.slice(0, i + 1).join("/"));
}

type ConflictPolicy = "skip" | "overwrite" | "suffix";

export interface RenameOptions {
    /** the client build dir */
    rootDir: string;
    ext?: string;                             // defaults to ".html"
    onConflict?: ConflictPolicy;              // defaults to "skip"
    dryRun?: boolean;                         // defaults to false
    removeEmptyDirs?: boolean;                // defaults to true
    /**
     * `advanced.basename`: its directory chain is left alone, so the basename's
     * own `index.html` stays `<basename>/index.html` instead of being hoisted to
     * `<parent>/<last-segment>.html` like a route directory would be.
     */
    basename?: string | null;
}

/**
 * Flatten React Router's prerender output: `<route>/index.html` → `<route>.html`,
 * so clean-URL static hosts resolve `/route` without a trailing slash.
 * https://github.com/remix-run/react-router/discussions/12596
 */
export function renamePrerenderedRoutes(opts: RenameOptions) {
    const {
        rootDir,
        ext = ".html",
        onConflict = "skip",
        dryRun = false,
        removeEmptyDirs = true,
        basename,
    } = opts;

    if (!fs.existsSync(rootDir)) {
        return;
    }

    const keep = new Set(basenameDirs(basename));

    const isIgnorableJunk = (name: string) =>
        name === ".DS_Store" || name === "Thumbs.db";

    const dirIsEmpty = (dir: string) => {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true })
                .filter(e => !isIgnorableJunk(e.name));
            return entries.length === 0;
        } catch {
            return false;
        }
    };

    const uniqueWithSuffix = (targetPath: string) => {
        const { dir, name, ext: e } = path.parse(targetPath);
        let i = 1;
        let candidate = targetPath;
        while (fs.existsSync(candidate)) {
            candidate = path.join(dir, `${name}-${i}${e}`);
            i++;
        }
        return candidate;
    };

    const moveIndexUp = (parentDir: string, subdirName: string) => {
        const folderPath = path.join(parentDir, subdirName);
        const indexHtmlPath = path.join(folderPath, "index.html");
        if (!fs.existsSync(indexHtmlPath)) return;

        let newHtmlPath = path.join(parentDir, `${subdirName}${ext}`);

        if (fs.existsSync(newHtmlPath)) {
            if (onConflict === "skip") {
                return;
            }
            if (onConflict === "overwrite") {
                if (!dryRun) fs.rmSync(newHtmlPath);
            }
            if (onConflict === "suffix") {
                newHtmlPath = uniqueWithSuffix(newHtmlPath);
            }
        }

        if (!dryRun) fs.renameSync(indexHtmlPath, newHtmlPath);

        if (removeEmptyDirs && dirIsEmpty(folderPath)) {
            if (!dryRun) fs.rmSync(folderPath, { recursive: true });
        }
    };

    const dfs = (dir: string) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            const subdir = path.join(dir, entry.name);
            // 1) descend first (process children)
            dfs(subdir);
            // 2) the basename chain is the mount point, not a route — its index stays
            const rel = path.relative(rootDir, subdir).split(path.sep).join("/");
            if (keep.has(rel)) continue;
            // 3) then flatten this subdir's index.html up into 'dir'
            moveIndexUp(dir, entry.name);
        }
    };

    dfs(rootDir);
}

/**
 * Move everything Vite emitted at the client root (`assets/`, `__spa-fallback.html`,
 * public-dir copies) under the basename directory, so `client/<basename>/` is a
 * self-contained tree whose files sit exactly where the base-prefixed URLs point.
 * `.vite/` (build metadata) stays at the root. An entry that already exists under
 * the basename is merged into — Vite does not empty an out-dir outside its root,
 * so a previous build's `assets/` is still there and the fresh files have to win.
 * Returns the names that moved.
 */
export function relocateUnderBasename(rootDir: string, basename: string): string[] {
    const segments = basename.split("/").filter(Boolean);
    if (!segments.length || !fs.existsSync(rootDir)) {
        return [];
    }
    const targetDir = path.join(rootDir, ...segments);
    fs.mkdirSync(targetDir, { recursive: true });

    const moved: string[] = [];
    for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
        if (entry.name === segments[0] || entry.name === ".vite") continue;
        if (entry.name === ".DS_Store" || entry.name === "Thumbs.db") continue;

        moveInto(path.join(rootDir, entry.name), path.join(targetDir, entry.name));
        moved.push(entry.name);
    }
    return moved;
}

/** rename `from` to `to`; when both are directories merge them, a file at `to` is replaced */
function moveInto(from: string, to: string) {
    if (!fs.existsSync(to)) {
        fs.renameSync(from, to);
        return;
    }
    if (fs.statSync(from).isDirectory() && fs.statSync(to).isDirectory()) {
        for (const entry of fs.readdirSync(from)) {
            moveInto(path.join(from, entry), path.join(to, entry));
        }
        fs.rmSync(from, { recursive: true, force: true });
        return;
    }
    fs.rmSync(to, { recursive: true, force: true });
    fs.renameSync(from, to);
}
