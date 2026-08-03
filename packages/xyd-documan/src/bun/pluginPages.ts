// Plugin pages (e.g. access-control /login + /auth/jwt-callback) — parity with the
// Vite path's `virtual:xyd-plugin-pages`. At bundle time we read the plugin-page
// registry (globalThis.__xydPluginPages, set by appInit) and generate ESM that
// statically imports each page's component from its `dist` specifier and registers
// them on globals the shared render tree reads. Returns "" when a project has no
// plugin pages (the common case) → the bundle entries are byte-identical, no regression.

/** Route → the leading-slash form used as the registry key + router match id. */
function normRoute(route: string): string {
  return route.startsWith("/") ? route : "/" + route;
}

/** ESM injected into the client + server bundle entries. Because ESM `import`s are
 *  hoisted, the `globalThis.*` registrations run after all imports resolve but before
 *  the entry's trailing `bootClient()` / render call. */
export function pluginPagesEntrySrc(): string {
  const pages: any[] = (globalThis as any).__xydPluginPages || [];
  if (!pages.length) return "";
  const hasAC = !!(globalThis as any).__xydSettings?.accessControl;
  const imports: string[] = [];
  const reg: string[] = [];
  pages.forEach((p, i) => {
    const dist = p.dist || p._pluginPkg;
    if (!dist || !p.route) return;
    imports.push(`import __PP${i} from ${JSON.stringify(dist)};`);
    reg.push(`${JSON.stringify(normRoute(p.route))}: __PP${i}`);
  });
  if (!reg.length) return "";
  if (hasAC) {
    imports.push(`import { AccessControlProvider as __ACP } from "@xyd-js/plugin-access-control/AccessControlContext";`);
  }
  return (
    imports.join("\n") +
    `\nglobalThis.__xydPluginPageComponents = { ${reg.join(", ")} };\n` +
    `globalThis.__xydAccessControlProvider = ${hasAC ? "__ACP" : "null"};\n`
  );
}

/** The set of registered plugin-page routes (leading-slash form). */
export function pluginPageRoutes(): string[] {
  const pages: any[] = (globalThis as any).__xydPluginPages || [];
  return pages.filter((p) => p?.route && (p.dist || p._pluginPkg)).map((p) => normRoute(p.route));
}

/** Match a request pathname (basename already handled by caller) to a plugin route. */
export function matchPluginPage(pathname: string): string | null {
  const routes = pluginPageRoutes();
  const p = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  return routes.find((r) => r === p) || null;
}

/** Page metadata (title/description) declared by the plugin for a route. */
export function pluginPageMeta(route: string): any {
  const pages: any[] = (globalThis as any).__xydPluginPages || [];
  const p = pages.find((x) => normRoute(x.route) === route);
  return p?.metadata || {};
}
