// Runtime bundling of PROJECT-LOCAL user components for the compiled node-free
// binary (module federation). See federationRegistry.ts for the why.
//
// The binary can't fold a project's own components into the prebuilt/embedded
// client & server bundles (no on-disk framework source to bundle against). So at
// `xyd build` / `xyd dev` we Bun.build the component files into a SEPARATE chunk
// whose `react` / `@xyd-js/*` imports are rewritten to a CJS shim that reads
// `globalThis.__xydModules` (populated by registerFederatedModules() inside the
// embedded bundles). The chunk registers each component on
// `globalThis.__xydUserComponentImpls[name]`, which render-tree.tsx merges into
// the Framework component map. Validated: Bun.build + this shim run inside a
// `bun --compile` executable with no node_modules.

import * as path from "node:path";
import * as fs from "node:fs";
import type { BunPlugin } from "bun";

export interface FederatedComponent {
    /** registry key used in config + FwSidebarComponent lookup, e.g. "./components/Foo" */
    name: string;
    /** absolute path to the component source/dist file */
    importPath: string;
}

/** Union of sidebar `{ component }` items and plugin/MDX user components that
 *  resolve to a real on-disk file — deduped by registry name. */
export function collectFederatedComponents(): FederatedComponent[] {
    const g = globalThis as any;
    const out: FederatedComponent[] = [];
    const seen = new Set<string>();

    const add = (name?: string, importPath?: string) => {
        if (!name || !importPath || seen.has(name)) return;
        if (!fs.existsSync(importPath)) return;
        seen.add(name);
        out.push({ name, importPath });
    };

    for (const c of (g.__xydSidebarComponentPaths || []) as any[]) {
        add(c.path, c.importPath);
    }
    // MDX / plugin user components that ship a real dist file (not inline).
    for (const c of (g.__xydUserComponents || []) as any[]) {
        if (c?.isInline || !c?.dist) continue;
        const abs = path.isAbsolute(c.dist) ? c.dist : path.resolve(process.cwd(), c.dist);
        add(c.name, abs);
    }
    return out;
}

/** Bun plugin: rewrite `react` / `react/*` / `@xyd-js/*` to a CJS shim that reads
 *  the runtime federation registry. esbuild turns the component's
 *  `import { x } from "<spec>"` into a runtime property access on the shim, so no
 *  export enumeration is needed. */
function federationPlugin(): BunPlugin {
    const FED = /^(react$|react\/jsx-runtime$|react\/jsx-dev-runtime$|react-dom$|react-dom\/client$|@xyd-js\/)/;
    return {
        name: "xyd-user-components-federation",
        setup(b) {
            b.onResolve({ filter: FED }, (a) => ({ path: a.path, namespace: "xyd-fed" }));
            b.onLoad({ namespace: "xyd-fed", filter: /.*/ }, (a) => ({
                contents: `module.exports = (globalThis.__xydModules && globalThis.__xydModules[${JSON.stringify(a.path)}]) || {};`,
                loader: "js",
            }));
        },
    };
}

function synthEntry(components: FederatedComponent[]): string {
    const imports = components
        .map((c, i) => `import __C${i} from ${JSON.stringify(c.importPath)};`)
        .join("\n");
    const assigns = components.map((c, i) => `  ${JSON.stringify(c.name)}: __C${i},`).join("\n");
    return (
        `${imports}\n` +
        `const g = globalThis;\n` +
        `g.__xydUserComponentImpls = Object.assign(g.__xydUserComponentImpls || {}, {\n${assigns}\n});\n`
    );
}

/** Build the SERVER (in-process, SSR) federated chunk. Returns the absolute output
 *  path to import() via pathToFileURL, or null when there are no components. */
export async function buildUserComponentsServer(
    components: FederatedComponent[],
    tmpDir: string,
): Promise<string | null> {
    if (!components.length) return null;
    const entryPath = path.join(tmpDir, ".xyd-user-components.server.entry.tsx");
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(entryPath, synthEntry(components));
    const res = await Bun.build({
        entrypoints: [entryPath],
        target: "bun",
        outdir: path.join(tmpDir, "server"),
        naming: "user-components.js",
        plugins: [federationPlugin()],
        sourcemap: "none",
    });
    if (!res.success) {
        throw new Error(`user-components (server) bundle failed:\n${res.logs.map((l) => String(l)).join("\n")}`);
    }
    return res.outputs.find((o) => o.kind === "entry-point")!.path;
}

/** Build the BROWSER (hydration) federated chunk into `outDir/assets` (hashed).
 *  Returns the public href (relative to outDir) + the absolute output path (the dev
 *  server serves the file directly at a fixed URL), or null when no components. */
export async function buildUserComponentsClient(
    components: FederatedComponent[],
    outDir: string,
): Promise<{ href: string; absPath: string } | null> {
    if (!components.length) return null;
    const tmp = path.join(outDir, ".xyd-uc-client-entry.tsx");
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(tmp, synthEntry(components));
    try {
        const res = await Bun.build({
            entrypoints: [tmp],
            target: "browser",
            outdir: outDir,
            naming: { entry: "assets/user-components-[hash].js", chunk: "assets/[name]-[hash].js" },
            plugins: [federationPlugin()],
            minify: true,
            sourcemap: "none",
        });
        if (!res.success) {
            throw new Error(`user-components (client) bundle failed:\n${res.logs.map((l) => String(l)).join("\n")}`);
        }
        const absPath = res.outputs.find((o) => o.kind === "entry-point")!.path;
        return { href: "/" + path.relative(outDir, absPath).replace(/\\/g, "/"), absPath };
    } finally {
        fs.rmSync(tmp, { force: true });
    }
}
