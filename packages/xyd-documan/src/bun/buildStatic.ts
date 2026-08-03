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

  // SECURITY (fail-closed): the Bun static build does not yet reproduce the full
  // access-control emit path (plugin login/auth pages, per-page protected content
  // chunks, frontmatter `public:false` gating, sidebar/navlink filtering). Rather
  // than risk shipping a static site that leaks protected content or 404s the
  // login flow, refuse an access-controlled project on the experimental XYD_BUN
  // build and point at the default (Vite) build, which supports it.
  if (settings?.accessControl) {
    console.error(
      "[build] accessControl is configured — the XYD_BUN static build does not support access control yet.\n" +
        "        Run the default build (without XYD_BUN) for access-controlled sites."
    );
    process.exit(1);
  }

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

  // S4.3 — in a compiled binary there is no node_modules / on-disk source to run
  // Bun.build against; the client/css/server render bundles were PREBUILT at
  // compile time and embedded (globalThis.__xydEmbed). Consume them instead.
  const isBin = !!(globalThis as any).__xydCompiledBinary;
  const emb = isBin ? (globalThis as any).__xydEmbed?.[themeName] : null;
  if (isBin && !emb) {
    console.error(
      `[build] no prebuilt render bundle embedded for theme "${themeName}".\n` +
        `        Built-in themes are supported; npm: themes require the default (Vite) build.`
    );
    process.exit(1);
  }

  // 1) CLIENT bundle — hashed, minified, no live-reload.
  let clientJs: string;
  if (isBin) {
    for (const f of emb.clientFiles) {
      const dst = path.join(clientDir, f.out);
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      await Bun.write(dst, Bun.file(f.src));
    }
    clientJs = emb.clientJs;
    console.error(`[build] client (embedded, ${emb.clientFiles.length} file(s)) →`, clientJs);
  } else {
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
    clientJs = "/" + path.relative(clientDir, clientEntry).replace(/\\/g, "/");
    console.error("[build] client →", clientJs);
  }

  // 2) CSS — the same package-dist groups the dev server serves per /_xyd/*.css,
  // concatenated (order preserved), content-hashed. Embedded in the binary.
  let cssLinks: string[];
  if (isBin) {
    for (const f of emb.cssFiles) {
      const dst = path.join(clientDir, f.out);
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      await Bun.write(dst, Bun.file(f.src));
    }
    cssLinks = emb.cssLinks;
    console.error(`[build] css (embedded) → ${cssLinks.length} files`);
  } else {
    cssLinks = await emitCss(HOST, themeName, clientDir);
  }

  // 3) Asset manifest for the (same-process) render bundle.
  (globalThis as any).__xydBuildAssets = { clientJs, cssLinks };

  // 4) SERVER render bundle → registers globalThis.__xydRenderStatic/__xydSeedForBuild.
  if (isBin) {
    // Extract the embedded (read-only bunfs) bundle to a writable tmp path, then
    // import it — a real module URL, in-process, sharing globalThis with appInit's
    // state. (Direct import of the bunfs path also works but is unguaranteed for
    // file-typed assets; extract-to-tmp is the certain path.)
    const os = await import("node:os");
    const tmp = path.join(os.tmpdir(), `xyd-srv-${Bun.hash(emb.server).toString(16)}.js`);
    await Bun.write(tmp, Bun.file(emb.server));
    console.error("[build] server render (embedded) →", path.basename(emb.server));
    await import(pathToFileURL(tmp).href);
  } else {
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
  }
  (globalThis as any).__xydSeedForBuild();

  // 5) PUBLIC assets. Content references public files WITH the `public/` segment
  // (e.g. /public/assets/logo.svg) and — because presets prefix logo/favicon and
  // some component images with the basename — ALSO as /<basename>/public/… . Mirror
  // to both so every ref resolves on a static host (dev's serveStatic reconciled
  // these at request time; a static build must place the files).
  const publicSrc = getPublicPath();
  copyDir(publicSrc, path.join(clientDir, "public"));
  const baseDir = (settings?.advanced?.basename || "").replace(/^\/+|\/+$/g, "");
  if (baseDir) copyDir(publicSrc, path.join(clientDir, baseDir, "public"));

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

  // 7) NON-PAGE emits (access-filtered where relevant).
  emitSitemap(clientDir, settings, accessMap, slugs);
  emitRobots(clientDir, settings);
  emitRawRouteFiles(clientDir); // /llms.txt + raw .md (already protected-filtered at appInit)

  // FAIL LOUD on any page that failed to render — otherwise a broken page ships
  // as a 404 while the build reports success (silent broken deploy).
  if (missing.length) {
    console.error(`[build] FAILED — ${missing.length} page(s) did not render:\n  ` + missing.join("\n  "));
    process.exit(1);
  }

  console.error(`[build] done → ${clientDir}`);
  process.exit(0);
}

/** sitemap.xml — port of host/app/sitemap.ts (access-filtered). Uses the actual
 *  prerendered page set + seo.domain for absolute URLs. */
function emitSitemap(clientDir: string, settings: any, accessMap: Record<string, string>, slugs: string[]) {
  if (!settings?.navigation?.sidebar && !settings?.navigation?.languages?.length) return; // loader 404s otherwise
  const baseUrl = settings?.seo?.domain || "";
  const routes: string[] = [];
  if ((globalThis as any).__xydHasIndexPage) routes.push("/");
  for (const slug of slugs) {
    if (slug === "index") continue;
    const acc = accessMap["/" + slug] || accessMap[slug];
    if (acc && acc !== "public") continue; // exclude protected
    routes.push("/" + slug);
  }
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    routes
      .map((r) => {
        const full = `${baseUrl}${r}`.replace(/([^:]\/)\/+/g, "$1");
        return `  <url>\n    <loc>${full}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>`;
      })
      .join("\n") +
    `\n</urlset>`;
  fs.writeFileSync(path.join(clientDir, "sitemap.xml"), xml);
  console.error(`[build] sitemap → ${routes.length} urls`);
}

/** robots.txt — port of host/app/robots.ts. */
function emitRobots(clientDir: string, settings: any) {
  const baseUrl = settings?.seo?.domain || "";
  const content = `# https://www.robotstxt.org/robotstxt.html\nUser-agent: *\nAllow: /\n\n# Sitemap\nSitemap: ${baseUrl}/sitemap.xml`;
  fs.writeFileSync(path.join(clientDir, "robots.txt"), content);
}

/** /llms.txt + raw .md/.mdx (keys of __xydRawRouteFiles; protected pages were
 *  already excluded when the map was built in appInit). */
function emitRawRouteFiles(clientDir: string) {
  const raw: Record<string, string> = (globalThis as any).__xydRawRouteFiles || {};
  let n = 0;
  for (const key of Object.keys(raw)) {
    const abs = path.join(clientDir, key.replace(/^\/+/, ""));
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, raw[key]);
    n++;
  }
  console.error(`[build] raw files → ${n} (incl. llms.txt)`);
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
