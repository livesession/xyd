import * as fs from "node:fs";
import * as path from "node:path";

import { XydError } from "./log";

/**
 * Merge of an xyd static build (`<docsRoot>/.xyd/build/client`) into the host app's
 * client outDir. Pure fs logic — no Vite, no child processes — so it is unit-testable
 * and reusable.
 *
 * xyd output anatomy (docs.json `advanced.basename: "/docs"`):
 *   assets/       hashed js/css at the CLIENT ROOT — the docs HTML references them as
 *                 absolute `/assets/*` (no basename prefix), so they must merge into
 *                 the host's root assets/ dir
 *   docs/         the page tree under the basename (incl. docs/public/, docs/llms.txt)
 *   public/       root duplicate of the docs public dir — bundled docs JS references
 *                 un-prefixed `/public/*` paths
 *   sitemap.xml   URLs currently LACK the basename prefix (upstream documan issue) —
 *                 skipped by default
 *   robots.txt    host owns it — skipped by default
 */

export interface MergeOptions {
    /** Expected mount path ("/docs"). When set, validated against the output tree. */
    base?: string;
    sitemap: "skip" | "copy";
    robots: "skip" | "copy";
}

interface CopyOp {
    src: string;
    dest: string;
    /** classification for reporting */
    kind: "asset" | "public" | "page-tree" | "root-file";
}

export interface MergePlan {
    ops: CopyOp[];
    /** conflicting dest paths (exist with DIFFERENT content) — a non-empty list must fail the merge */
    conflicts: string[];
    /** dest files that already exist with identical content (skipped) */
    skippedIdentical: number;
    /** informational notes (skipped sitemap/robots, …) */
    notes: string[];
    /** .html files in the page tree */
    pages: number;
    assets: number;
    /** the resolved mount path, e.g. "/docs" */
    mount: string;
}

export interface MergeSummary {
    pages: number;
    assets: number;
    skippedIdentical: number;
    notes: string[];
    mount: string;
}

function sameContent(a: string, b: string): boolean {
    const sa = fs.statSync(a);
    const sb = fs.statSync(b);
    if (sa.size !== sb.size) return false;
    // Uint8Array wrappers dodge the Buffer generic clash across @types/node versions
    return Buffer.compare(new Uint8Array(fs.readFileSync(a)), new Uint8Array(fs.readFileSync(b))) === 0;
}

/** Recursively plan copying `srcDir` into `destDir` with the identical-skip / different-conflict rule. */
function planDir(srcDir: string, destDir: string, kind: CopyOp["kind"], plan: MergePlan) {
    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
        const src = path.join(srcDir, entry.name);
        const dest = path.join(destDir, entry.name);
        if (entry.isDirectory()) {
            planDir(src, dest, kind, plan);
        } else {
            if (fs.existsSync(dest)) {
                if (sameContent(src, dest)) {
                    plan.skippedIdentical++;
                } else {
                    plan.conflicts.push(dest);
                }
                continue;
            }
            plan.ops.push({ src, dest, kind });
            if (kind === "asset") plan.assets++;
            if (kind === "page-tree" && entry.name.endsWith(".html")) plan.pages++;
        }
    }
}

/**
 * Classify the docs client dir and produce a merge plan. Throws XydError on
 * structural problems (missing basename, base mismatch). Collects ALL content
 * conflicts instead of throwing on the first, so a doomed merge reports completely.
 */
export function planMerge(docsClientDir: string, hostOutDir: string, options: MergeOptions): MergePlan {
    if (!fs.existsSync(docsClientDir)) {
        throw new XydError(`docs build output not found at ${docsClientDir} — did the docs build run?`);
    }

    // The basename is baked into every prerendered link, so a docs build without one
    // would put its page tree at the client ROOT and collide with the host app.
    if (fs.existsSync(path.join(docsClientDir, "index.html"))) {
        throw new XydError(
            `the docs build has NO basename — its pages sit at the output root and would collide with your app.\n` +
            (options.base
                ? `  \`base: "${options.base}"\` was passed (via XYD_BASENAME) but the resolved xyd CLI ignored it —\n` +
                  `  upgrade xyd to a version that supports XYD_BASENAME, or add to your docs settings:\n` +
                  `  "advanced": { "basename": "${options.base}" }`
                : `  Set the plugin's \`base\` option (e.g. base: "/docs") or add to your docs settings:\n` +
                  `  "advanced": { "basename": "/docs" }`)
        );
    }

    const plan: MergePlan = { ops: [], conflicts: [], skippedIdentical: 0, notes: [], pages: 0, assets: 0, mount: "" };
    const pageTreeDirs: string[] = [];

    for (const entry of fs.readdirSync(docsClientDir, { withFileTypes: true })) {
        const src = path.join(docsClientDir, entry.name);

        // .vite/ is Vite's own build metadata (manifest.json) — not servable content,
        // and the host build may emit its own (React Router does) — never merge it.
        if (entry.name === ".vite") continue;

        if (entry.isDirectory() && entry.name === "assets") {
            planDir(src, path.join(hostOutDir, "assets"), "asset", plan);
            continue;
        }
        if (entry.isDirectory() && entry.name === "public") {
            // never rm -rf — merge file-by-file so host-owned public files survive
            planDir(src, path.join(hostOutDir, "public"), "public", plan);
            continue;
        }
        if (!entry.isDirectory() && (entry.name === "sitemap.xml" || entry.name === "robots.txt")) {
            const policy = entry.name === "sitemap.xml" ? options.sitemap : options.robots;
            if (policy === "copy") {
                const dest = path.join(hostOutDir, entry.name);
                if (fs.existsSync(dest)) {
                    plan.notes.push(`kept the host's ${entry.name} (docs copy skipped)`);
                } else {
                    plan.ops.push({ src, dest, kind: "root-file" });
                    if (entry.name === "sitemap.xml") {
                        plan.notes.push(`copied the docs sitemap.xml — note: its URLs currently lack the basename prefix (xyd issue)`);
                    }
                }
            } else {
                plan.notes.push(`skipped docs ${entry.name} (policy: skip)`);
            }
            continue;
        }

        // Everything else is the basename page tree (a "docs/" dir, flatten artifacts
        // like a root "docs.html", or multi-segment basenames like "help/docs/").
        if (entry.isDirectory()) {
            pageTreeDirs.push(entry.name);
            planDir(src, path.join(hostOutDir, entry.name), "page-tree", plan);
        } else {
            const dest = path.join(hostOutDir, entry.name);
            if (fs.existsSync(dest)) {
                if (sameContent(src, dest)) plan.skippedIdentical++;
                else plan.conflicts.push(dest);
            } else {
                plan.ops.push({ src, dest, kind: "page-tree" });
                if (entry.name.endsWith(".html")) plan.pages++;
            }
        }
    }

    if (!pageTreeDirs.length) {
        throw new XydError(`no page tree found in the docs build output at ${docsClientDir} — the docs build produced nothing to mount`);
    }
    plan.mount = "/" + pageTreeDirs[0];

    if (options.base) {
        const baseTop = options.base.replace(/^\/+/, "").split("/")[0];
        if (!pageTreeDirs.includes(baseTop)) {
            throw new XydError(
                `\`base: "${options.base}"\` does not match the docs build output (found: ${pageTreeDirs.map((d) => "/" + d).join(", ")}).\n` +
                `  \`base\` must equal \`advanced.basename\` in the docs settings — the basename is baked into every prerendered link.`
            );
        }
        plan.mount = options.base;
    }

    // Pretty-URL portability: xyd emits flat `<slug>.html` pages, which clean-URL
    // hosts (Netlify, `serve`) map from extensionless links — but express-style
    // static servers (react-router-serve) don't. Mirror every page as
    // `<slug>/index.html` too, so `/docs/overview` resolves everywhere via the
    // universal directory-index convention (express 301s to the trailing slash).
    const planned = new Set(plan.ops.map((op) => op.dest));
    for (const op of [...plan.ops]) {
        if (op.kind !== "page-tree" || !op.dest.endsWith(".html") || path.basename(op.dest) === "index.html") continue;
        const mirror = path.join(op.dest.slice(0, -".html".length), "index.html");
        if (planned.has(mirror) || fs.existsSync(mirror)) continue;
        planned.add(mirror);
        plan.ops.push({ src: op.src, dest: mirror, kind: "page-tree" });
    }

    return plan;
}

export function executeMerge(plan: MergePlan): void {
    for (const op of plan.ops) {
        fs.mkdirSync(path.dirname(op.dest), { recursive: true });
        fs.copyFileSync(op.src, op.dest);
    }
}

export function formatConflicts(conflicts: string[], hostOutDir: string): string {
    const rel = conflicts.map((c) => `  - ${path.relative(hostOutDir, c)}`).join("\n");
    return (
        `the host build already emitted ${conflicts.length} file(s) with DIFFERENT content at the docs merge paths:\n${rel}\n` +
        `  Host routes/assets must not overlap the docs mount path (\`advanced.basename\`).`
    );
}

/** plan → throw on conflicts → execute. The single entry point the plugin (and tests) use. */
export function mergeDocsBuild(docsClientDir: string, hostOutDir: string, options: MergeOptions): MergeSummary {
    const plan = planMerge(docsClientDir, hostOutDir, options);
    if (plan.conflicts.length) {
        throw new XydError(formatConflicts(plan.conflicts, hostOutDir));
    }
    executeMerge(plan);
    return {
        pages: plan.pages,
        assets: plan.assets,
        skippedIdentical: plan.skippedIdentical,
        notes: plan.notes,
        mount: plan.mount,
    };
}
