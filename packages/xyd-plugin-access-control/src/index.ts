import type { Plugin as VitePlugin } from "vite";
import type { Plugin, PluginConfig } from "@xyd-js/plugins";
import type { AccessControl } from "@xyd-js/core";

import { resolvePageAccess, type AccessMap } from "./access";
import { virtualAccessControlSettingsPlugin } from "./virtual";
import { generateAuthPrehydrationScript } from "./scripts/authPrehydration";
import { generateNetlifyEdge } from "./middleware/netlify";
import { generateVercelMiddleware } from "./middleware/vercel";
import { generateCloudflareMiddleware } from "./middleware/cloudflare";
import { protectedContentPlugin } from "./content";

import AuthGuard from "./components/AuthGuard";
import LoginPage from "./components/LoginPage";
import AuthCallbackPage from "./components/AuthCallbackPage";

export { evaluateAccess, resolvePageAccess, buildAccessMap } from "./access";
export type { AccessMap, AccessLevel, AccessEvaluation } from "./access";
export { default as AuthGuard, useAuth } from "./components/AuthGuard";
export { default as LoginPage } from "./components/LoginPage";
export { default as AuthCallbackPage } from "./components/AuthCallbackPage";
export { filterSidebarGroups, filterProtectedPaths } from "./navigation";

/**
 * Edge middleware Vite plugin.
 * Generates platform-specific middleware files during build closeBundle step.
 */
function edgeMiddlewarePlugin(config: AccessControl): VitePlugin {
  return {
    name: "xyd-plugin-access-control-edge",
    apply: "build",
    closeBundle() {
      if (!config.edge) return;

      const outputDir = (globalThis as any).__xydBuildOutputDir
        || ".xyd/build/client";

      switch (config.edge.platform) {
        case "netlify":
          generateNetlifyEdge(config, outputDir);
          break;
        case "vercel":
          generateVercelMiddleware(config, outputDir);
          break;
        case "cloudflare":
          generateCloudflareMiddleware(config, outputDir);
          break;
      }
    },
  };
}

/**
 * Build the access map from globalThis.__xydPagePathMapping.
 * Called lazily (from virtual module load or edge middleware closeBundle)
 * because __xydPagePathMapping is not available at plugin init time —
 * it is set by pluginDocs() which runs after loadPlugins().
 */
function buildAccessMapFromGlobals(config: AccessControl): AccessMap {
  const pagePathMapping: Record<string, string> =
    (globalThis as any).__xydPagePathMapping || {};

  const accessMap: AccessMap = {};

  for (const pagePath of Object.keys(pagePathMapping)) {
    const access = resolvePageAccess(pagePath, {}, config);
    // Store with both forms so lookups work regardless of slash prefix
    accessMap[pagePath] = access;
    const withSlash = pagePath.startsWith("/") ? pagePath : `/${pagePath}`;
    accessMap[withSlash] = access;
  }

  // Store for edge middleware generators and llms.txt filtering
  (globalThis as any).__xydAccessMap = accessMap;

  return accessMap;
}

/**
 * Access control plugin for xyd documentation sites.
 *
 * Provides:
 * - Pre-hydration script to prevent flash of protected content
 * - AuthGuard React component for route-level access enforcement
 * - Virtual modules with access control config and access map
 * - Edge middleware generators for Netlify, Vercel, Cloudflare
 * - Login and callback page components
 */
export default function AccessControlPlugin(
  pluginOptions: AccessControl
): Plugin {
  return (settings) => {
    const config = pluginOptions;

    // Resolve cookie name and groups claim for pre-hydration script
    const cookieName = config.session?.cookieName || "xyd-auth-token";
    const groupsClaim =
      "groupsClaim" in config.provider
        ? (config.provider as any).groupsClaim || "groups"
        : "groups";

    // CSS to hide protected content before auth check
    const authCss = `[data-auth="anonymous"] [data-auth-protected]{display:none!important}`;

    const prehydrationScript = generateAuthPrehydrationScript(
      cookieName,
      groupsClaim
    );

    const head: [string, Record<string, any>, string?][] = [
      ["style", {}, authCss],
      ["script", {}, prehydrationScript],
    ];

    const vitePlugins: VitePlugin[] = [
      virtualAccessControlSettingsPlugin(config, buildAccessMapFromGlobals),
      protectedContentPlugin(config, buildAccessMapFromGlobals),
    ];

    if (config.edge) {
      vitePlugins.push(edgeMiddlewarePlugin(config));
    }

    // Resolve callback route
    const callbackRoute =
      "callbackPath" in config.provider
        ? (config.provider as any).callbackPath || "/auth/jwt-callback"
        : "/auth/jwt-callback";

    return {
      name: "plugin-access-control",
      vite: vitePlugins,
      head,
      // Custom pages rendered inside the xyd theme layout
      pages: [
        {
          route: "/login",
          component: LoginPage,
          dist: "@xyd-js/plugin-access-control/LoginPage",
          metadata: {
            title: config.login?.title || "Sign in",
            description: config.login?.description,
          },
          public: true,
        },
        {
          route: callbackRoute,
          component: AuthCallbackPage,
          dist: "@xyd-js/plugin-access-control/AuthCallbackPage",
          metadata: { title: "Authenticating" },
          public: true,
        },
      ],
    };
  };
}
