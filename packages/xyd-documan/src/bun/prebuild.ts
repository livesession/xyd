// S4.3 compile-time prebuild driver. Runs ONLY at `bun scripts/compile.ts` time
// (Bun, writable repo, node_modules present) — NEVER in the shipped binary. It
// produces, per theme, the client + server render bundles + CSS that the compiled
// binary embeds and consumes instead of the runtime `Bun.build` render (which
// can't work in the read-only bunfs with no on-disk source/node_modules).
//
// The runtime consumers live behind `if (__xydCompiledBinary)` in buildStatic.ts.

import * as path from "node:path";
import * as fs from "node:fs";
import type { BunPlugin } from "bun";

import { buildBundle, recomputeIconSet, setBuildContext } from "./startDevServer";

export interface ThemeArtifacts {
  /** every client output file: {src=absolute on disk, out=rel path under build client/} */
  clientFiles: { src: string; out: string }[];
  /** public href of the client entry (e.g. /assets/client-<hash>.js) */
  clientJs: string;
  cssFiles: { src: string; out: string }[];
  cssLinks: string[];
  /** absolute path to the prebuilt server render bundle */
  server: string;
}

// Deps that are 'external' in the dev/build server bundle (they read their own
// files via import.meta.url and break when inlined) but CANNOT stay external in
// the binary (no runtime node_modules). Stub them: TS-source API docs (typedoc/
// sources) degrade to empty; shiki/vscode-* degrade to a no-op highlighter.
const SERVER_DEAD = /^(typedoc|@xyd-js\/sources|shiki|vscode-oniguruma|vscode-textmate)(\/|$)/;
const SERVER_STUB = [
  "export default {};",
  "export const sourcesToUniformV2 = async () => ({ references: [], projectJson: {} });",
  "export const uniformToMiniUniform = () => [];",
  "export const uniformToReactUniform = () => [];",
  "export const getHighlighter = async () => ({ codeToHtml: (c) => c, codeToTokens: () => ({ tokens: [] }) });",
  "export const createHighlighter = async () => ({ codeToHtml: (c) => c, codeToTokens: () => ({ tokens: [] }) });",
  "export const bundledLanguages = {};",
  "export const bundledThemes = {};",
].join("\n");

function stubServerDeps(): BunPlugin {
  return {
    name: "xyd-prebuild-stub",
    setup(b) {
      b.onResolve({ filter: SERVER_DEAD }, (a) => ({ path: a.path, namespace: "xyd-prebuild-stub" }));
      b.onLoad({ filter: /.*/, namespace: "xyd-prebuild-stub" }, () => ({ contents: SERVER_STUB, loader: "js" }));
    },
  };
}

/** Replicated from buildStatic.emitCss but writing to an arbitrary outDir (the
 *  prebuilt theme dir) — resolves the 4 package-dist CSS groups from `host`,
 *  concatenates + content-hashes each group, returns {links, files}. */
async function prebuildCss(host: string, themeName: string, outDir: string): Promise<{ links: string[]; files: { src: string; out: string }[] }> {
  const rs = (spec: string) => {
    try { return Bun.resolveSync(spec, host); } catch { return null; }
  };
  const pkgDist = (pkg: string, file: string) => {
    try { return Bun.resolveSync(pkg + "/package.json", host).replace(/package\.json$/, "") + file; } catch { return null; }
  };
  const groups: [string, (string | null)[]][] = [
    ["theme", [rs(`@xyd-js/theme-${themeName}/index.css`) || pkgDist(`@xyd-js/theme-${themeName}`, "dist/index.css")]],
    ["components", [rs("@xyd-js/components/index.css") || pkgDist("@xyd-js/components", "dist/index.css")]],
    ["atlas", [
      rs("@xyd-js/atlas/index.css") || pkgDist("@xyd-js/atlas", "index.css"),
      rs("@xyd-js/atlas/tokens.css") || pkgDist("@xyd-js/atlas", "tokens.css"),
      rs("@xyd-js/atlas/styles.css") || pkgDist("@xyd-js/atlas", "styles.css"),
    ]],
    ["ui", [rs("@xyd-js/ui/index.css") || pkgDist("@xyd-js/ui", "dist/index.css")]],
  ];
  const links: string[] = [];
  const files: { src: string; out: string }[] = [];
  for (const [label, groupFiles] of groups) {
    let css = "";
    for (const f of groupFiles) {
      if (!f) continue;
      const bf = Bun.file(f);
      if (await bf.exists()) css += (await bf.text()) + "\n";
    }
    if (!css) continue;
    const hash = Bun.hash(css).toString(16).slice(0, 8);
    const out = `assets/${label}-${hash}.css`;
    const abs = path.join(outDir, out);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, css);
    links.push("/" + out);
    files.push({ src: abs, out });
  }
  return { links, files };
}

/** Prebuild client + server + css for each theme into `prebuiltDir/<theme>/`.
 *  `host` must resolve react/react-dom/@xyd-js runtime + every theme (the monorepo
 *  root works — all workspace-linked). Returns the per-theme artifact manifest. */
export async function prebuildThemes(host: string, themes: string[], prebuiltDir: string): Promise<Record<string, ThemeArtifacts>> {
  process.env.XYD_HOST = host;
  const manifest: Record<string, ThemeArtifacts> = {};

  for (const theme of themes) {
    console.error(`[prebuild] theme=${theme}`);
    setBuildContext(host, theme);

    // Default (empty) icon set baked into the client for the proof; step 10 lifts
    // the project-specific set into the runtime __xyd_data payload.
    const iconSetJson = await recomputeIconSet({ theme: { name: theme } } as any);

    const themeDir = path.join(prebuiltDir, theme);
    fs.rmSync(themeDir, { recursive: true, force: true });
    fs.mkdirSync(themeDir, { recursive: true });

    // CLIENT (browser, hashed, minified, no sourcemap) — same entry buildStatic uses.
    const clientRes: any = await buildBundle(
      `client-${theme}`,
      `globalThis.__xydIconSet = ${iconSetJson};\n` +
        `import Theme from "@xyd-js/theme-${theme}";\n` +
        `import { bootClient } from "./client-entry";\nbootClient(Theme);\n`,
      "browser",
      [],
      true,
      {
        outdir: themeDir,
        naming: { entry: "assets/client-[hash].js", chunk: "assets/[name]-[hash].js", asset: "assets/[name]-[hash].[ext]" },
        minify: true,
        sourcemap: "none",
        returnResult: true,
      }
    );
    const clientEntry = clientRes.outputs.find((o: any) => o.kind === "entry-point").path;
    const clientJs = "/" + path.relative(themeDir, clientEntry).replace(/\\/g, "/");
    const clientFiles = clientRes.outputs.map((o: any) => ({
      src: o.path,
      out: path.relative(themeDir, o.path).replace(/\\/g, "/"),
    }));

    // CSS — concat + hash the 4 dist groups into themeDir/assets/*.css.
    const { links: cssLinks, files: cssFiles } = await prebuildCss(host, theme, themeDir);

    // SERVER render bundle (bun, sourcemap NONE — inline would be ~100MB; the dead
    // server-only deps are stubbed, not external, so the binary needs no node_modules).
    const serverBundle: string = await buildBundle(
      `server-${theme}`,
      `import Theme from "@xyd-js/theme-${theme}";\n` +
        `import { renderPageStatic, seedForBuild } from "./renderPage";\n` +
        `globalThis.__xydSeedForBuild = () => seedForBuild(Theme);\n` +
        `globalThis.__xydRenderStatic = (slug, opts) => renderPageStatic(slug, opts);\n`,
      "bun",
      [],
      false,
      { outdir: path.join(themeDir, "server"), sourcemap: "none", extraPlugins: [stubServerDeps()] }
    );

    manifest[theme] = { clientFiles, clientJs, cssFiles, cssLinks, server: serverBundle };
    console.error(`[prebuild]   client ${clientFiles.length} file(s), css ${cssFiles.length}, server ${(fs.statSync(serverBundle).size / 1e6).toFixed(1)}MB`);
  }
  return manifest;
}

/** Generate `embedTsPath` (packages/xyd-cli/src/embed.generated.ts): a module of
 *  `import … with { type: "file" }` statements (a STATIC edge so `bun --compile`
 *  embeds each artifact into the executable) that assigns globalThis.__xydEmbed. */
export function generateEmbedModule(manifest: Record<string, ThemeArtifacts>, embedTsPath: string): void {
  const dir = path.dirname(embedTsPath);
  const rel = (abs: string) => "./" + path.relative(dir, abs).replace(/\\/g, "/");
  const imports: string[] = [];
  let n = 0;
  const id = () => `f${n++}`;

  const themesObj: string[] = [];
  for (const [theme, a] of Object.entries(manifest)) {
    const clientFiles = a.clientFiles.map((f) => {
      const v = id();
      imports.push(`import ${v} from ${JSON.stringify(rel(f.src))} with { type: "file" };`);
      return `{ src: ${v}, out: ${JSON.stringify(f.out)} }`;
    });
    const cssFiles = a.cssFiles.map((f) => {
      const v = id();
      imports.push(`import ${v} from ${JSON.stringify(rel(f.src))} with { type: "file" };`);
      return `{ src: ${v}, out: ${JSON.stringify(f.out)} }`;
    });
    const srv = id();
    imports.push(`import ${srv} from ${JSON.stringify(rel(a.server))} with { type: "file" };`);
    themesObj.push(
      `  ${JSON.stringify(theme)}: {\n` +
        `    clientFiles: [${clientFiles.join(", ")}],\n` +
        `    clientJs: ${JSON.stringify(a.clientJs)},\n` +
        `    cssFiles: [${cssFiles.join(", ")}],\n` +
        `    cssLinks: ${JSON.stringify(a.cssLinks)},\n` +
        `    server: ${srv},\n` +
        `  },`
    );
  }

  const src =
    `// AUTO-GENERATED by @xyd-js/documan prebuild at compile time — DO NOT EDIT.\n` +
    `// Committed as an empty stub; \`bun scripts/compile.ts\` overwrites it with the\n` +
    `// per-theme \`with { type: "file" }\` imports that bun --compile embeds.\n` +
    imports.join("\n") + (imports.length ? "\n" : "") +
    `(globalThis as any).__xydEmbed = {\n${themesObj.join("\n")}\n};\n`;
  fs.writeFileSync(embedTsPath, src);
  console.error(`[prebuild] wrote ${embedTsPath} (${Object.keys(manifest).length} theme(s), ${n} embedded files)`);
}
