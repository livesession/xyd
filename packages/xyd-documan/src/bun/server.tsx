import { bootRender, renderPage, getThemeName } from "./renderPage";

/**
 * WIP Bun-native dev server (plan S1). Boots the render pipeline once, then
 * serves each route via `renderPage` (SSR, no Vite, no React Router). Run with
 * the shim preloaded, cwd = a docs project:
 *
 *   cd apps/docs && XYD_DEV_MODE=1 bun \
 *     --preload ../../packages/xyd-documan/src/bun/preload.ts \
 *     ../../packages/xyd-documan/src/bun/server.tsx
 */

const base = import.meta.dir;

function tryResolve(...specs: string[]): string | null {
  for (const s of specs) {
    try {
      return Bun.resolveSync(s, base);
    } catch {
      /* next */
    }
  }
  return null;
}

function pkgDist(pkg: string, file: string): string | null {
  try {
    const pj = Bun.resolveSync(pkg + "/package.json", base);
    return pj.replace(/package\.json$/, "") + file;
  } catch {
    return null;
  }
}

await bootRender();
const themeName = getThemeName();

// Real CSS files served as <link> (CSS extraction happens at package build).
const CSS: Record<string, (string | null)[]> = {
  "/_xyd/theme.css": [
    tryResolve(`@xyd-js/theme-${themeName}/index.css`) ||
      pkgDist(`@xyd-js/theme-${themeName}`, "dist/index.css"),
  ],
  "/_xyd/components.css": [tryResolve("@xyd-js/components/index.css") || pkgDist("@xyd-js/components", "dist/index.css")],
  "/_xyd/atlas.css": [
    tryResolve("@xyd-js/atlas/index.css") || pkgDist("@xyd-js/atlas", "index.css"),
    tryResolve("@xyd-js/atlas/tokens.css") || pkgDist("@xyd-js/atlas", "tokens.css"),
    tryResolve("@xyd-js/atlas/styles.css") || pkgDist("@xyd-js/atlas", "styles.css"),
  ],
  "/_xyd/ui.css": [tryResolve("@xyd-js/ui/index.css") || pkgDist("@xyd-js/ui", "dist/index.css")],
};

async function serveCss(paths: (string | null)[]): Promise<Response> {
  let out = "";
  for (const p of paths) {
    if (!p) continue;
    const f = Bun.file(p);
    if (await f.exists()) out += (await f.text()) + "\n";
  }
  return new Response(out, { headers: { "content-type": "text/css; charset=utf-8" } });
}

const server = Bun.serve({
  port: Number(process.env.XYD_PORT ?? 5180),
  development: true,
  async fetch(req) {
    const url = new URL(req.url);
    if (CSS[url.pathname]) return serveCss(CSS[url.pathname]);
    if (url.pathname === "/_bun/client.js") {
      return new Response("/* SSR-only slice: no client hydration yet (S1) */", {
        headers: { "content-type": "text/javascript; charset=utf-8" },
      });
    }
    const slug = decodeURIComponent(url.pathname.replace(/^\//, ""));
    try {
      const html = await renderPage(slug);
      return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
    } catch (e: any) {
      console.error(`render error for /${slug}:`, e);
      return new Response(`<pre>render error for /${slug}\n\n${e?.stack || e}</pre>`, {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
});

console.log(`xyd bun dev (S1 render) → ${server.url}  [theme: ${themeName}]`);
