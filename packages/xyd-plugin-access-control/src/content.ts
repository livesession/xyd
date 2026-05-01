import type { Plugin as VitePlugin } from "vite";
import type { AccessControl } from "@xyd-js/core";
import type { AccessMap } from "./access";
import { isAuthBypassed } from "./devOnly";

type AccessMapBuilder = (config: AccessControl) => AccessMap;

/**
 * Vite plugin that compiles protected page content into separate chunks
 * served from /__xyd_protected_content/{slug}.js
 *
 * During build:
 * - Protected pages are compiled to MDX code strings
 * - Each is written as a separate file in the output directory
 *
 * During dev:
 * - A middleware intercepts requests to /__xyd_protected_content/
 * - Compiles the page on-demand and returns the MDX code
 */
export function protectedContentPlugin(
  config: AccessControl,
  buildAccessMap: AccessMapBuilder
): VitePlugin {
  let cachedAccessMap: AccessMap | null = null;

  function getAccessMap(): AccessMap {
    if (!cachedAccessMap) {
      cachedAccessMap = buildAccessMap(config);
    }
    return cachedAccessMap;
  }
  return {
    name: "xyd-plugin-access-control-protected-content",

    configureServer(server) {
      // Redirect unauthenticated requests to protected pages (works for curl, browsers, etc.)
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0] || "";

        // Skip assets, virtual modules, and special paths
        if (
          url.startsWith("/assets/") ||
          url.startsWith("/@") ||
          url.startsWith("/__") ||
          url.startsWith("/node_modules/") ||
          url.includes(".") ||
          url === "/login" ||
          url.startsWith("/auth/")
        ) {
          return next();
        }

        const am = getAccessMap();
        const slug = url.replace(/^\//, "");
        const access = am["/" + slug] || am[slug];

        if (!access || access === "public") {
          return next();
        }

        // Check auth cookie
        const cookieHeader = req.headers.cookie || "";
        const cookieName = config.session?.cookieName || "xyd-auth-token";
        const hasToken = cookieHeader.includes(`${cookieName}=`);

        const isBypassed = isAuthBypassed();

        if (!hasToken && !isBypassed) {
          // Always redirect to /login (xyd login page), not the external auth URL.
          const redirect = "/login?redirect=" + encodeURIComponent(req.url || "/");
          res.writeHead(302, { Location: redirect });
          res.end();
          return;
        }

        next();
      });

      // Dev server middleware: compile protected pages on-demand
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/__xyd_protected_content/")) {
          return next();
        }

        const slug = decodeURIComponent(
          req.url.replace("/__xyd_protected_content/", "").replace(/\.js$/, "")
        );

        const am = getAccessMap();
        const pageAccess = am["/" + slug] || am[slug];
        if (!pageAccess || pageAccess === "public") {
          res.statusCode = 404;
          res.end("Not found");
          return;
        }

        // Check auth cookie/token from request
        const cookieHeader = req.headers.cookie || "";
        const hasAuthToken = cookieHeader.includes("xyd-auth-token=");

        const isBypassed = isAuthBypassed();

        if (!hasAuthToken && !isBypassed) {
          res.statusCode = 401;
          res.end("Unauthorized");
          return;
        }

        // Compile the page content
        const pagePath = globalThis.__xydPagePathMapping?.[slug];
        if (!pagePath) {
          res.statusCode = 404;
          res.end("Page not found");
          return;
        }

        try {
          const { ContentFS } = await import("@xyd-js/content");
          const { markdownPlugins } = await import("@xyd-js/content/md");

          const settings = globalThis.__xydSettings;
          const mdPlugins = await markdownPlugins({ maxDepth: 2 }, settings);

          const remarkPlugins = [...mdPlugins.remarkPlugins];
          const rehypePlugins = [...mdPlugins.rehypePlugins];

          if (globalThis.__xydUserMarkdownPlugins?.remark?.length) {
            remarkPlugins.push(globalThis.__xydUserMarkdownPlugins.remark);
          }
          if (globalThis.__xydUserMarkdownPlugins?.rehype?.length) {
            rehypePlugins.push(globalThis.__xydUserMarkdownPlugins.rehype);
          }

          const contentFs = new ContentFS(
            settings,
            remarkPlugins,
            rehypePlugins,
            mdPlugins.recmaPlugins,
            globalThis.__xydUserMarkdownPlugins?.remarkRehypeHandlers || {}
          );

          const code = await contentFs.compile(pagePath);

          res.setHeader("Content-Type", "application/javascript");
          res.setHeader("Cache-Control", "no-store");
          res.end(code);
        } catch (e) {
          console.error(
            "[xyd:access-control] Failed to compile protected content:",
            e
          );
          res.statusCode = 500;
          res.end("Internal error");
        }
      });
    },

    async closeBundle() {
      const { writeFileSync, mkdirSync } = await import("node:fs");
      const { join } = await import("node:path");
      // Build time: compile all protected pages into separate files
      const outputDir = join(
        process.cwd(),
        ".xyd/build/client/__xyd_protected_content"
      );
      mkdirSync(outputDir, { recursive: true });

      const pagePathMapping = globalThis.__xydPagePathMapping || {};

      for (const [slug, access] of Object.entries(getAccessMap())) {
        if (access === "public") continue;

        const normalizedSlug = slug.startsWith("/") ? slug.slice(1) : slug;
        const pagePath = pagePathMapping[normalizedSlug] || pagePathMapping[slug];
        if (!pagePath) continue;

        try {
          const { ContentFS } = await import("@xyd-js/content");
          const { markdownPlugins } = await import("@xyd-js/content/md");

          const settings = globalThis.__xydSettings;
          const mdPlugins = await markdownPlugins({ maxDepth: 2 }, settings);

          const remarkPlugins = [...mdPlugins.remarkPlugins];
          const rehypePlugins = [...mdPlugins.rehypePlugins];

          if (globalThis.__xydUserMarkdownPlugins?.remark?.length) {
            remarkPlugins.push(globalThis.__xydUserMarkdownPlugins.remark);
          }
          if (globalThis.__xydUserMarkdownPlugins?.rehype?.length) {
            rehypePlugins.push(globalThis.__xydUserMarkdownPlugins.rehype);
          }

          const contentFs = new ContentFS(
            settings,
            remarkPlugins,
            rehypePlugins,
            mdPlugins.recmaPlugins,
            globalThis.__xydUserMarkdownPlugins?.remarkRehypeHandlers || {}
          );

          const code = await contentFs.compile(pagePath);
          const fileName = `${encodeURIComponent(normalizedSlug)}.js`;
          writeFileSync(join(outputDir, fileName), code, "utf-8");
        } catch (e) {
          console.error(
            `[xyd:access-control] Failed to compile protected page ${slug}:`,
            e
          );
        }
      }
    },
  };
}
