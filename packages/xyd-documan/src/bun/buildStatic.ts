import * as path from "node:path";
import * as fs from "node:fs";
import { pathToFileURL } from "node:url";

import { appInit, getHostPath, getBuildPath, getPublicPath } from "../../dist/index.js";
import { buildBundle, recomputeIconSet, setBuildContext } from "./startDevServer";
import { robotsTxt, sitemapXml, sitemapRoutes } from "./seo";
import { themePackage, themeShortName } from "./themePkg";
import { settingsBundleJs } from "./serialize";
import { pluginPagesEntrySrc, pluginPageRoutes } from "./pluginPages";

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

  // Access control (Layer-1): the prerender loop excludes protected content from
  // HTML (shellOnly, resolveShellOnly), emits per-page protected-content chunks
  // for post-auth client load, renders the plugin login/auth pages, and filters
  // the sitemap by __xydAccessMap. Layer-2 edge deploy adapters (server.mjs etc.)
  // are not emitted here yet — a deploy-configured project should use the default
  // build until that lands.

  const HOST = getHostPath();
  process.env.XYD_HOST = HOST;
  const rawName: string = settings?.theme?.name || "poetry";
  const themeName = themeShortName(rawName); // short label / embed key
  const themePkg = themePackage(rawName);    // import specifier (npm: → bare pkg)
  setBuildContext(HOST, rawName);
  console.error("[build] host:", HOST, "| theme:", themeName);
  await recomputeIconSet(settings); // side-effect: globalThis.__xydIconSet = project set (the SSR shell emits it)

  const clientDir = path.join(getBuildPath(), "client");
  fs.rmSync(clientDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(clientDir, "assets"), { recursive: true });

  // S4.3 — in a compiled binary there is no node_modules / on-disk source to run
  // Bun.build against; the client/css/server render bundles were PREBUILT at
  // compile time and embedded (globalThis.__xydEmbed). Consume them instead.
  const isBin = !!(globalThis as any).__xydCompiledBinary;
  const embRoot = isBin ? (globalThis as any).__xydEmbed : null;
  const emb = isBin ? embRoot?.themes?.[themeName] : null;
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
      // iconSet is NOT baked — the SSR shell injects the project set (step 10).
      `import Theme from "${themePkg}";\n${pluginPagesEntrySrc()}` +
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
    cssLinks = await emitCss(HOST, themePkg, clientDir);
  }

  // 2b) Icon set as ONE hashed, cached asset (project-specific) — NOT inlined per
  // page: the default Iconify set is ~840KB, which would bloat every page's HTML.
  const iconSetSrc = "globalThis.__xydIconSet=" + JSON.stringify((globalThis as any).__xydIconSet || {}) + ";";
  const iconHash = Bun.hash(iconSetSrc).toString(16).slice(0, 8);
  const iconSetOut = `assets/iconset-${iconHash}.js`;
  fs.writeFileSync(path.join(clientDir, iconSetOut), iconSetSrc);
  const iconSetJs = "/" + iconSetOut;

  // 2c) Settings as ONE hashed external asset (virtual_xyd-settings-<hash>.js) —
  // parity with the Vite virtual:xyd-settings bundle. Keeps the raw, all-locale
  // settings ("i18n:" keys, per-locale overrides) OUT of every page's HTML.
  const settingsSrc = settingsBundleJs((globalThis as any).__xydSettings, (globalThis as any).__xydSettingsClone);
  const settingsHash = Bun.hash(settingsSrc).toString(16).slice(0, 8);
  const settingsOut = `assets/virtual_xyd-settings-${settingsHash}.js`;
  fs.writeFileSync(path.join(clientDir, settingsOut), settingsSrc);
  const settingsJs = "/" + settingsOut;

  // 3) Asset manifest for the (same-process) render bundle.
  (globalThis as any).__xydBuildAssets = { clientJs, cssLinks, iconSetJs, settingsJs };

  // 4) SERVER render bundle → registers globalThis.__xydRenderStatic/__xydSeedForBuild.
  if (isBin) {
    // Extract the embedded (read-only bunfs) bundle to a writable tmp path, then
    // import it — a real module URL, in-process, sharing globalThis with appInit's
    // state. (Direct import of the bunfs path also works but is unguaranteed for
    // file-typed assets; extract-to-tmp is the certain path.)
    const os = await import("node:os");
    const tmp = path.join(os.tmpdir(), `xyd-srv-${Bun.hash(embRoot.server).toString(16)}.js`);
    await Bun.write(tmp, Bun.file(embRoot.server));
    console.error("[build] server render (embedded, multi-theme) →", path.basename(embRoot.server));
    await import(pathToFileURL(tmp).href);
  } else {
    console.error("[build] bundling server render…");
    const serverBundle: string = await buildBundle(
      "buildserver",
      `import Theme from "${themePkg}";\n${pluginPagesEntrySrc()}` +
        `import { renderPageStatic, seedForBuild, buildPageData, renderPluginPageStatic } from "./renderPage";\n` +
        `globalThis.__xydSeedForBuild = () => seedForBuild(Theme);\n` +
        `globalThis.__xydRenderStatic = (slug, opts) => renderPageStatic(slug, opts);\n` +
        `globalThis.__xydRenderPluginStatic = (route) => renderPluginPageStatic(route);\n` +
        `globalThis.__xydCompileContent = (slug) => buildPageData(slug, { shellOnly: false }).then((d) => d.code || "");\n`,
      "bun",
      ["typedoc", "@xyd-js/sources", "shiki", "vscode-oniguruma", "vscode-textmate"]
    );
    await import(pathToFileURL(serverBundle).href);
  }
  // The multi-theme server bundle selects the theme by name; the non-binary
  // single-theme entry ignores the arg — so passing themeName is safe for both.
  (globalThis as any).__xydSeedForBuild(themeName);

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

  // 6a) PROTECTED CONTENT CHUNKS: for every protected page emit the compiled MDX at
  // /__xyd_protected_content/<encodeURIComponent(slug)>.js. It was excluded from the
  // page HTML (shellOnly); the client's ProtectedPageShell fetches it AFTER auth.
  // Static host = no server re-check, so this mirrors Vite's Layer-1 model (the
  // chunk is protected by obscurity + the edge adapter when Layer-2 is configured).
  const compile = (globalThis as any).__xydCompileContent;
  if (compile) {
    let chunks = 0;
    for (const slug of slugs) {
      const acc = accessMap["/" + slug] || accessMap[slug];
      if (!acc || acc === "public") continue;
      try {
        const code = await compile(slug);
        if (code) {
          const dir = path.join(clientDir, "__xyd_protected_content");
          fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, encodeURIComponent(slug) + ".js"), code);
          chunks++;
        }
      } catch { /* a broken protected page just has no post-auth content */ }
    }
    if (chunks) console.error(`[build] protected content chunks → ${chunks}`);
  }

  // 6d) PLUGIN PAGES (access-control /login, /auth/jwt-callback, …) → their own
  // HTML files (parity with the RR prerender of __xydPluginPages). Marked public in
  // the access map, so they aren't shell-excluded.
  const pluginRoutes = pluginPageRoutes();
  const renderPlugin = (globalThis as any).__xydRenderPluginStatic;
  if (pluginRoutes.length && renderPlugin) {
    let pp = 0;
    for (const route of pluginRoutes) {
      try {
        const html = await renderPlugin(route);
        writeHtml(clientDir, route.replace(/^\/+/, ""), html);
        pp++;
      } catch (e: any) {
        missing.push(`${route} (plugin page): ${e?.message || e}`);
      }
    }
    if (pp) console.error(`[build] plugin pages → ${pp}`);
  }

  // 6b) Root fallback: a project with no explicit index page still needs `/` to
  // serve something (parity with the RR ssr:false root shell; better than a 404 on
  // the deployed site). Render the first page at index.html — it carries the same
  // client bundle + settings asset, so the app boots there too.
  if (!mapping["index"] && !(globalThis as any).__xydHasIndexPage && !missing.length) {
    const first = slugs.find((k) => k !== "index" && !((accessMap["/" + k] || accessMap[k]) && (accessMap["/" + k] || accessMap[k]) !== "public"));
    if (first) {
      try {
        const html = await (globalThis as any).__xydRenderStatic(first, { shellOnly: false });
        writeHtml(clientDir, "index", html);
        console.error(`[build] root index.html → ${first}`);
      } catch { /* non-fatal */ }
    }
  }

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

/** sitemap.xml — via the shared ./seo helpers (identical to the dev server). */
function emitSitemap(clientDir: string, settings: any, accessMap: Record<string, string>, slugs: string[]) {
  const routes = sitemapRoutes(slugs, accessMap, !!(globalThis as any).__xydHasIndexPage);
  const xml = sitemapXml(settings, routes); // build: no request origin — seo.domain or ""
  if (!xml) return; // no navigation → loader would 404
  fs.writeFileSync(path.join(clientDir, "sitemap.xml"), xml);
  console.error(`[build] sitemap → ${routes.length} urls`);
}

/** robots.txt — via the shared ./seo helper (identical to the dev server). */
function emitRobots(clientDir: string, settings: any) {
  fs.writeFileSync(path.join(clientDir, "robots.txt"), robotsTxt(settings));
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
async function emitCss(HOST: string, themePkg: string, clientDir: string): Promise<string[]> {
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
    ["theme", [rs(`${themePkg}/index.css`) || pkgDist(themePkg, "dist/index.css")]],
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
