import type { Plugin as VitePlugin } from "vite";
import type { AccessControl } from "@xyd-js/core";
import type { AccessMap } from "./access";

const VIRTUAL_SETTINGS_ID = "virtual:xyd-access-control-settings";
const RESOLVED_SETTINGS_ID = "\0" + VIRTUAL_SETTINGS_ID;

const VIRTUAL_GUARD_ID = "virtual:xyd-access-control-guard";
const RESOLVED_GUARD_ID = "\0" + VIRTUAL_GUARD_ID;

const VIRTUAL_PAGES_ID = "virtual:xyd-plugin-pages";
const RESOLVED_PAGES_ID = "\0" + VIRTUAL_PAGES_ID;

type AccessMapBuilder = (config: AccessControl) => AccessMap;

/**
 * Vite plugin that provides the access control settings as a virtual module.
 * The access map is built lazily (on first load) because __xydPagePathMapping
 * is not available until after pluginDocs() runs.
 */
export function virtualAccessControlSettingsPlugin(
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
    name: "xyd-plugin-access-control-virtual-settings",
    resolveId(id) {
      if (id === VIRTUAL_SETTINGS_ID) return RESOLVED_SETTINGS_ID;
      if (id === VIRTUAL_GUARD_ID) return RESOLVED_GUARD_ID;
      if (id === VIRTUAL_PAGES_ID) return RESOLVED_PAGES_ID;
      return null;
    },
    load(id) {
      if (id === RESOLVED_SETTINGS_ID) {
        // Dev bypass: when XYD_AUTH_BYPASS is set, make all pages public
        const isBypassed = process.env.XYD_AUTH_BYPASS === "1" || process.env.XYD_AUTH_BYPASS === "true";

        // Sanitize config - remove secrets before bundling
        const safeConfig = sanitizeConfig(config);

        // Build access map lazily - __xydPagePathMapping is now available
        const accessMap = isBypassed ? {} : getAccessMap();

        if (isBypassed) {
          console.log("[xyd:access-control] Auth bypass enabled (XYD_AUTH_BYPASS). All pages are public.");
        }

        return `
export const accessControlConfig = ${JSON.stringify(safeConfig)};
export const accessMap = ${JSON.stringify(accessMap)};
`;
      }
      if (id === RESOLVED_GUARD_ID) {
        return `export { default as AuthGuard, useAuth } from "@xyd-js/plugin-access-control/AuthGuard";`;
      }
      if (id === RESOLVED_PAGES_ID) {
        // Generate imports for all plugin pages from their dist paths
        const pluginPages: any[] = (globalThis as any).__xydPluginPages || [];
        const imports: string[] = [];
        const entries: string[] = [];

        pluginPages.forEach((page: any, i: number) => {
          const dist = page.dist || page._pluginPkg;
          if (dist) {
            imports.push(`import Page${i} from "${dist}";`);
            entries.push(`  "${page.route}": Page${i}`);
          }
        });

        return [
          ...imports,
          `export const pluginPages = {`,
          entries.join(",\n"),
          `};`,
        ].join("\n");
      }
      return null;
    },
    // Invalidate cached access map when settings change (dev HMR)
    handleHotUpdate() {
      cachedAccessMap = null;
    },
  };
}

/**
 * Remove sensitive values (secrets, passwords) from config before bundling.
 */
function sanitizeConfig(config: AccessControl): AccessControl {
  const safe = { ...config };

  if (safe.provider) {
    const provider = { ...safe.provider };

    if ("secret" in provider) {
      provider.secret = undefined;
    }
    if ("password" in provider) {
      (provider as any).password = "***";
    }

    safe.provider = provider as any;
  }

  return safe;
}
