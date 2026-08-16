// Shared SEO generators — parity with the Vite/host path. Used by BOTH the Bun
// dev server (renderPage.start) and the static build (buildStatic), so dev and
// build emit byte-identical SEO output:
//   - metaTagsHtml  ← plugin-docs pages/page.tsx meta()
//   - robotsTxt     ← xyd-host app/robots.ts
//   - sitemapXml    ← xyd-host app/sitemap.ts + buildStatic emitSitemap
//
// SUPPORTED_META_TAGS mirrors packages/xyd-plugin-docs/src/pages/metatags.ts —
// keep in sync (it isn't exported from the package, and importing plugin-docs
// into the render bundle would drag in the whole plugin).

export const SUPPORTED_META_TAGS: Record<string, "name" | "property"> = {
  robots: "name", charset: "name", viewport: "name", description: "name",
  keywords: "name", author: "name", googlebot: "name", google: "name",
  "google-site-verification": "name", generator: "name", "theme-color": "name",
  "color-scheme": "name", "format-detection": "name", referrer: "name",
  refresh: "name", rating: "name", "revisit-after": "name", language: "name",
  copyright: "name", "reply-to": "name", distribution: "name", coverage: "name",
  category: "name", target: "name", HandheldFriendly: "name", MobileOptimized: "name",
  "apple-mobile-web-app-capable": "name", "apple-mobile-web-app-status-bar-style": "name",
  "apple-mobile-web-app-title": "name", "application-name": "name",
  "msapplication-TileColor": "name", "msapplication-TileImage": "name",
  "msapplication-config": "name",
  "og:title": "property", "og:type": "property", "og:url": "property",
  "og:image": "property", "og:description": "property", "og:site_name": "property",
  "og:locale": "property", "og:video": "property", "og:audio": "property",
  "twitter:card": "property", "twitter:site": "property", "twitter:creator": "property",
  "twitter:title": "property", "twitter:description": "property", "twitter:image": "property",
  "twitter:image:alt": "property", "twitter:player": "property",
  "twitter:player:width": "property", "twitter:player:height": "property",
  "twitter:app:name:iphone": "property", "twitter:app:id:iphone": "property",
  "twitter:app:url:iphone": "property",
  "article:published_time": "property", "article:modified_time": "property",
  "article:expiration_time": "property", "article:author": "property",
  "article:section": "property", "article:tag": "property",
  "book:author": "property", "book:isbn": "property", "book:release_date": "property",
  "book:tag": "property",
  "profile:first_name": "property", "profile:last_name": "property",
  "profile:username": "property", "profile:gender": "property",
  "music:duration": "property", "music:album": "property", "music:album:disc": "property",
  "music:album:track": "property", "music:musician": "property", "music:song": "property",
  "music:song:disc": "property", "music:song:track": "property",
  "video:actor": "property", "video:actor:role": "property", "video:director": "property",
  "video:writer": "property", "video:duration": "property", "video:release_date": "property",
  "video:tag": "property", "video:series": "property",
};

function esc(x: any): string {
  return String(x).replace(/[&<>"]/g, (c) => (({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" } as any)[c]));
}

/** Exact port of plugin-docs meta() minus the <title> (the shell owns the title).
 *  seo.metatags are applied first, then page frontmatter OVERRIDES them (same key
 *  → one tag, no duplicates); the `description` meta is emitted once from
 *  metadata.description and skipped in both loops; noindex → robots. */
export function metaTagsHtml(metadata: any, settings: any): string {
  const description = metadata?.description || "";
  const out: string[] = [];
  if (description) out.push(`<meta name="description" content="${esc(description)}">`);

  const map: Record<string, { attr: string; content: any }> = {};
  const collect = (obj: any) => {
    for (const key in obj || {}) {
      const attr = SUPPORTED_META_TAGS[key];
      if (!attr) continue;
      if (description && key === "description") continue;
      map[key] = { attr, content: obj[key] };
    }
  };
  collect(settings?.seo?.metatags);
  collect(metadata);
  if (metadata?.noindex) map["robots"] = { attr: "name", content: "noindex" };

  for (const key in map) {
    if (map[key].content == null) continue;
    out.push(`<meta ${map[key].attr}="${esc(key)}" content="${esc(map[key].content)}">`);
  }
  return out.join("");
}

/** robots.txt — parity with host app/robots.ts. `origin` is the dev request
 *  origin fallback when seo.domain is unset (build passes ""). */
export function robotsTxt(settings: any, origin = ""): string {
  const baseUrl = settings?.seo?.domain || origin || "";
  return `# https://www.robotstxt.org/robotstxt.html\nUser-agent: *\nAllow: /\n\n# Sitemap\nSitemap: ${baseUrl}/sitemap.xml`;
}

/** The access-filtered route list for the sitemap (index + non-index slugs).
 *  Shared by dev + build so both include exactly the same URLs. */
export function sitemapRoutes(slugs: string[], accessMap: Record<string, string>, hasIndex: boolean): string[] {
  const routes: string[] = [];
  if (hasIndex) routes.push("/");
  for (const slug of slugs) {
    if (slug === "index" || slug === "") continue;
    const acc = accessMap["/" + slug] || accessMap[slug];
    if (acc && acc !== "public") continue; // exclude protected
    routes.push("/" + slug);
  }
  return routes;
}

/** sitemap.xml — parity with host app/sitemap.ts + buildStatic emitSitemap.
 *  Returns null when there's no navigation (loader would 404). */
export function sitemapXml(settings: any, routes: string[], origin = ""): string | null {
  if (!settings?.navigation?.sidebar && !settings?.navigation?.languages?.length) return null;
  const baseUrl = settings?.seo?.domain || origin || "";
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    routes
      .map((r) => {
        const full = `${baseUrl}${r}`.replace(/([^:]\/)\/+/g, "$1");
        return `  <url>\n    <loc>${full}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>`;
      })
      .join("\n") +
    `\n</urlset>`
  );
}
