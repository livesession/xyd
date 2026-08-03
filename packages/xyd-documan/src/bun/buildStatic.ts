import * as path from "node:path";
import * as fs from "node:fs";
import { pathToFileURL } from "node:url";

import { appInit, getHostPath, getBuildPath, getPublicPath } from "../../dist/index.js";
import { buildBundle, recomputeIconSet, setBuildContext } from "./startDevServer";

/**
 * S3 static build (SSG). `XYD_BUN=1 xyd build` runs this instead of the two Vite
 * passes + React-Router prerender. It reuses the S1/S2 Bun render path:
 * appInit → hashed client bundle → CSS emit → a bundled server-render (drives
 * renderPageStatic) → copy public/ → prerender every page to <slug>.html.
 * Output stays the publish contract: `.xyd/build/client/`.
 *
 * Note: this module is run as raw TSX by Bun (via buildLauncher). It must NOT
 * import renderPage/render-tree directly — those pull react-router through the
 * leaf packages and only resolve inside a Bun.build (makeShims alias). The
 * per-page render therefore goes through the bundled server-render's
 * globalThis.__xydRenderStatic, exactly like dev's __xydBunStart.
 */

const DIR = import.meta.dir;

export async function buildStatic(cwd: string = process.cwd()): Promise<void> {
  process.chdir(cwd);
  process.env.NODE_ENV = "production";
  delete process.env.XYD_AUTH_BYPASS; // never bake protected content into the static output

  console.error("[build] appInit…");
  const inited = await appInit();
  if (!inited) {
    console.error("[build] appInit produced no settings");
    process.exit(1);
  }
  const settings = (globalThis as any).__xydSettings;

  const HOST = getHostPath();
  process.env.XYD_HOST = HOST;
  const rawName: string = settings?.theme?.name || "poetry";
  const themeName = rawName.startsWith("npm:") ? rawName.slice("npm:".length) : rawName;
  setBuildContext(HOST, themeName);
  console.error("[build] host:", HOST, "| theme:", themeName);
  const iconSetJson = await recomputeIconSet(settings);

  const clientDir = path.join(getBuildPath(), "client");
  fs.rmSync(clientDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(clientDir, "assets"), { recursive: true });

  // 1) CLIENT bundle — hashed, minified, no live-reload.
  console.error("[build] bundling client (hashed, minified)…");
  const clientRes: any = await buildBundle(
    "client",
    `globalThis.__xydIconSet = ${iconSetJson};\n` +
      `import Theme from "@xyd-js/theme-${themeName}";\n` +
      `import { bootClient } from "./client-entry";\nbootClient(Theme);\n`,
    "browser",
    [],
    true,
    {
      outdir: clientDir,
      naming: { entry: "assets/client-[hash].js", chunk: "assets/[name]-[hash].js", asset: "assets/[name]-[hash].[ext]" },
      minify: true,
      sourcemap: "none",
      returnResult: true,
    }
  );
  const clientEntry = clientRes.outputs.find((o: any) => o.kind === "entry-point").path;
  const clientJs = "/" + path.relative(clientDir, clientEntry).replace(/\\/g, "/");
  console.error("[build] client →", clientJs);

  // 2) CSS — resolve the same package-dist groups the dev server serves per
  // /_xyd/*.css, concatenate (order preserved), content-hash, write.
  const cssLinks = await emitCss(HOST, themeName, clientDir);

  // 3) Asset manifest for the (same-process) render bundle.
  (globalThis as any).__xydBuildAssets = { clientJs, cssLinks };

  // 4) SERVER render bundle (makeShims via buildBundle) → drive renderPageStatic.
  console.error("[build] bundling server render…");
  const serverBundle: string = await buildBundle(
    "buildserver",
    `import Theme from "@xyd-js/theme-${themeName}";\n` +
      `import { renderPageStatic, seedForBuild } from "./renderPage";\n` +
      `globalThis.__xydSeedForBuild = () => seedForBuild(Theme);\n` +
      `globalThis.__xydRenderStatic = (slug, opts) => renderPageStatic(slug, opts);\n`,
    "bun",
    ["typedoc", "@xyd-js/sources", "shiki", "vscode-oniguruma", "vscode-textmate"]
  );
  await import(pathToFileURL(serverBundle).href);
  (globalThis as any).__xydSeedForBuild();

  // 5) PUBLIC assets → client root (content references them as root paths).
  copyDir(getPublicPath(), clientDir);

  // 6) PRERENDER every content page (shellOnly-aware) → flat <slug>.html.
  const accessMap: Record<string, string> = (globalThis as any).__xydAccessMap || {};
  const mapping: Record<string, string> = (globalThis as any).__xydPagePathMapping || {};
  const slugs = Object.keys(mapping);
  console.error(`[build] prerendering ${slugs.length} pages…`);
  let ok = 0;
  const missing: string[] = [];
  for (const slug of slugs) {
    const acc = accessMap["/" + slug] || accessMap[slug];
    const shellOnly = !!acc && acc !== "public"; // static host = no deploy adapter → always shell
    try {
      const html = await (globalThis as any).__xydRenderStatic(slug, { shellOnly });
      writeHtml(clientDir, slug, html);
      ok++;
    } catch (e: any) {
      missing.push(`${slug}: ${e?.message || e}`);
    }
  }
  console.error(`[build] wrote ${ok}/${slugs.length} pages`);
  if (missing.length) console.error("[build] render failures:\n  " + missing.slice(0, 10).join("\n  "));

  // TODO (next batch): sitemap.xml, robots.txt, llms.txt, raw .md, plugin pages,
  // protected-content chunks.

  console.error(`[build] done → ${clientDir}`);
  process.exit(0);
}

/** Resolve the 4 package-dist CSS groups (same order the dev server serves),
 *  concat, content-hash, write to assets/, return the hrefs (order preserved). */
async function emitCss(HOST: string, themeName: string, clientDir: string): Promise<string[]> {
  const rs = (spec: string) => {
    try {
      return Bun.resolveSync(spec, HOST);
    } catch {
      return null;
    }
  };
  const pkgDist = (pkg: string, file: string) => {
    try {
      return Bun.resolveSync(pkg + "/package.json", HOST).replace(/package\.json$/, "") + file;
    } catch {
      return null;
    }
  };
  const groups: [string, (string | null)[]][] = [
    ["theme", [rs(`@xyd-js/theme-${themeName}/index.css`) || pkgDist(`@xyd-js/theme-${themeName}`, "dist/index.css")]],
    ["components", [rs("@xyd-js/components/index.css") || pkgDist("@xyd-js/components", "dist/index.css")]],
    [
      "atlas",
      [
        rs("@xyd-js/atlas/index.css") || pkgDist("@xyd-js/atlas", "index.css"),
        rs("@xyd-js/atlas/tokens.css") || pkgDist("@xyd-js/atlas", "tokens.css"),
        rs("@xyd-js/atlas/styles.css") || pkgDist("@xyd-js/atlas", "styles.css"),
      ],
    ],
    ["ui", [rs("@xyd-js/ui/index.css") || pkgDist("@xyd-js/ui", "dist/index.css")]],
  ];
  const links: string[] = [];
  for (const [label, files] of groups) {
    let css = "";
    for (const f of files) {
      if (!f) continue;
      const bf = Bun.file(f);
      if (await bf.exists()) css += (await bf.text()) + "\n";
    }
    if (!css) continue;
    const hash = Bun.hash(css).toString(16).slice(0, 8);
    const name = `assets/${label}-${hash}.css`;
    fs.writeFileSync(path.join(clientDir, name), css);
    links.push("/" + name);
  }
  console.error(`[build] css → ${links.length} files`);
  return links;
}

/** '/' → index.html, else <slug>.html (mkdir -p parents), matching the Vite
 *  build's flattened output. */
function writeHtml(clientDir: string, slug: string, html: string) {
  const rel = slug === "index" || slug === "" ? "index.html" : `${slug}.html`;
  const abs = path.join(clientDir, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, html);
}

function copyDir(src: string, dest: string) {
  if (!src || !fs.existsSync(src)) return;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(d, { recursive: true });
      copyDir(s, d);
    } else {
      fs.mkdirSync(path.dirname(d), { recursive: true });
      fs.copyFileSync(s, d);
    }
  }
}
