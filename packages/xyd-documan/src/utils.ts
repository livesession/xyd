import path, { dirname } from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { execSync, ExecSyncOptions } from "node:child_process";
import crypto from "node:crypto";
import { realpathSync } from "node:fs";
import * as fsPromises from "node:fs/promises";

import { Root, ListItem } from "mdast";
import { toMarkdown } from "mdast-util-to-markdown";
import { u } from "unist-builder";
import matter from "gray-matter";
// remark parsing no longer needed for frontmatter extraction here

import {
  createServer,
  PluginOption as VitePluginOption,
  Plugin as VitePlugin,
} from "vite";
import { reactRouter } from "@react-router/dev/vite";
import { IconSet } from "@iconify/tools";

import {
  readSettings,
  pluginDocs,
  type PluginDocsOptions,
  PluginOutput,
} from "@xyd-js/plugin-docs";
import { vitePlugins as xydContentVitePlugins } from "@xyd-js/content/vite";
import { HeadConfig, Integrations, Plugins, Settings } from "@xyd-js/core";
import type { IconLibrary, WebEditorNavigationItem } from "@xyd-js/core";
import type { Plugin, PluginConfig } from "@xyd-js/plugins";
import { type UniformPlugin } from "@xyd-js/uniform";

// import { readSettings } from "./settings";
import pluginDemoVersion from "../../xyd-plugin-supademo/package.json";
import pluginChatwootVersion from "../../xyd-plugin-chatwoot/package.json";
import pluginIntercomVersion from "../../xyd-plugin-intercom/package.json";
import pluginLivechatVersion from "../../xyd-plugin-livechat/package.json";

import {
  BUILD_FOLDER_PATH,
  CACHE_FOLDER_PATH,
  HOST_FOLDER_PATH,
  XYD_FOLDER_PATH,
} from "./const";
import { CLI } from "./cli";
import { componentDependencies, componentsInstall } from "./componentsInstall";

// gray-matter imported via ESM to avoid dynamic require issues in ESM builds

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to parse frontmatter and create AST nodes using gray-matter
async function parseFrontmatterAndCreateAST(
  settings: Settings,
  content: string,
  filePath: string
): Promise<ListItem | null> {
  if (settings?.ai?.llmsTxt === false) {
    return null;
  }

  try {
    const { data: fm } = matter(content) || { data: {} };
    const title = fm?.title || "";
    const description = fm?.description || "";

    if (!title) {
      return null;
    }

    const rawPath = filePath.replace(/^\/+/, "/"); // Ensure single leading slash
    const aiBaseUrl =
      typeof settings?.ai?.llmsTxt !== "string"
        ? settings?.ai?.llmsTxt?.baseUrl
        : "";
    const isAbsolute = /^https?:\/\//i.test(rawPath);
    const url = isAbsolute
      ? rawPath
      : aiBaseUrl
        ? aiBaseUrl.replace(/\/$/, "") + rawPath
        : rawPath;
    // Create AST nodes using unist-builder
    const linkNode = u("link", { url }, [u("text", title)]);

    const paragraphChildren: any[] = [linkNode];

    if (description) {
      paragraphChildren.push(u("text", `: ${description}`));
    }

    const paragraphNode = u("paragraph", paragraphChildren);
    const listItemNode = u("listItem", [paragraphNode]);

    return listItemNode as ListItem;
  } catch (error) {
    console.warn(`Failed to parse frontmatter for ${filePath}:`, error);
    return null;
  }
}

// Function to build the complete markdown AST
function buildLLMsMarkdownAST(
  settings: Settings,
  rawRouteFiles: { [path: string]: string },
  markdownItems: ListItem[]
): string {
  const aiLlms = settings?.ai?.llmsTxt as unknown;
  if (aiLlms === false) {
    return "";
  }

  const looksLikePath = isLLMsTxtPath(settings);

  if (looksLikePath) {
    const tryPaths = lookupPaths(aiLlms as string) || [];

    for (const pth of tryPaths) {
      const exists = fs.existsSync(pth);
      if (!exists) {
        continue;
      }

      const value = fs.readFileSync(pth, "utf8");

      // Treat as raw markdown fallback; normalize leading spaces before headings
      const normalized = value
        .split("\n")
        .map((line) => line.replace(/^\s+(#{1,6}\s+)/, "$1"))
        .join("\n")
        .trim();

      return normalized;
    }
  }

  // Default H1 title
  let h1Title = "";

  // If index page exists, use its frontmatter title for H1
  const pathMappingIndex = globalThis.__xydPagePathMapping["index"];
  if (pathMappingIndex) {
    const indexContent = rawRouteFiles[normalizePath(pathMappingIndex)];
    if (indexContent) {
      try {
        const { data } = matter(indexContent) || { data: {} };
        if (data?.title && typeof data.title === "string") {
          h1Title = data.title;
        }
      } catch {}
    }
  }

  // If llmsTxt is an object, allow overriding title/summary and appending sections
  let summaryText = "";
  const extraBlocks: any[] = [];
  if (aiLlms && typeof aiLlms === "object") {
    const obj = aiLlms as any;
    if (typeof obj.title === "string" && obj.title.trim()) {
      h1Title = obj.title.trim();
    }
    if (typeof obj.summary === "string" && obj.summary.trim()) {
      summaryText = obj.summary.trim();
    }
    if (obj.sections && typeof obj.sections === "object") {
      for (const key of Object.keys(obj.sections)) {
        const sec = obj.sections[key];
        if (!sec || typeof sec !== "object") continue;
        const sTitle = sec.title;
        const sUrl = sec.url;
        const sDescription = sec.description;
        if (!sTitle) continue;
        // Create a section heading and an optional single-item list with link/description
        extraBlocks.push(u("heading", { depth: 2 }, [u("text", sTitle)]));
        if (sUrl) {
          const linkNode = u("link", { url: sUrl }, [u("text", sTitle)]);
          const paraChildren: any[] = [linkNode];
          if (sDescription) paraChildren.push(u("text", `: ${sDescription}`));
          const listItem = u("listItem", [u("paragraph", paraChildren)]);
          extraBlocks.push(
            u("list", { ordered: false, spread: false }, [listItem])
          );
        } else if (sDescription) {
          extraBlocks.push(u("paragraph", [u("text", sDescription)]));
        }
      }
    }
  }

  const children: any[] = [];
  children.push(u("heading", { depth: 1 }, [u("text", h1Title)]));
  if (summaryText) {
    children.push(u("paragraph", [u("text", summaryText)]));
  }
  children.push(u("heading", { depth: 2 }, [u("text", "Docs")]));
  children.push(u("list", { ordered: false, spread: false }, markdownItems));
  if (extraBlocks.length) {
    children.push(...extraBlocks);
  }

  const root = u("root", children);

  return toMarkdown(root as Root, {
    bullet: "-",
    bulletOther: "*",
    bulletOrdered: ".",
  });
}

const ANALYTICS_INTEGRATION_DEPENDENCIES = {
  livesession: {
    "@pluganalytics/provider-livesession": "0.0.0-pre.7",
  },
};

const EXTERNAL_XYD_PLUGINS = {
  "@xyd-js/plugin-supademo": pluginDemoVersion.version,
  "@xyd-js/plugin-chatwoot": pluginChatwootVersion.version,
  "@xyd-js/plugin-intercom": pluginIntercomVersion.version,
  "@xyd-js/plugin-livechat": pluginLivechatVersion.version,
};

function isLLMsTxtPath(settings: Settings) {
  const aiLlms = settings?.ai?.llmsTxt as unknown;

  // If llmsTxt is a string, replace output entirely.
  if (typeof aiLlms === "string" && aiLlms?.trim()) {
    const value = aiLlms;
    const looksLikePath =
      /\.(md|mdx|txt)$/i.test(value) ||
      (!value.includes("\n") &&
        !value.startsWith("#") &&
        !value.startsWith("- "));

    return looksLikePath;
  }

  return false;
}

export async function appInit(options?: PluginDocsOptions) {
  const readPreloadSettings = await readSettings(); // TODO: in the future better solution - currently we load settings twice (pluginDocs and here)
  if (!readPreloadSettings) {
    return null;
  }

  const preloadSettings: Settings =
    typeof readPreloadSettings === "string"
      ? JSON.parse(readPreloadSettings)
      : readPreloadSettings;

  {
    if (!preloadSettings.integrations?.search) {
      preloadSettings.integrations = {
        ...(preloadSettings.integrations || {}),
        search: {
          orama: true,
        },
      };
    }

    const plugins = integrationsToPlugins(preloadSettings.integrations);
    if (preloadSettings.plugins) {
      preloadSettings.plugins = [...plugins, ...preloadSettings.plugins];
    } else {
      preloadSettings.plugins = plugins;
    }
  }

  let resolvedPlugins: LoadedPlugin[] = [];
  {
    resolvedPlugins = (await loadPlugins(preloadSettings, options)) || [];
    const userUniformVitePlugins: UniformPlugin<any>[] = [];
    const userMarkdownPlugins = {
      rehype: [] as any,
      remark: [] as any
    }
    const componentPlugins: any[] = []; // TODO: fix any

    resolvedPlugins?.forEach((p: LoadedPlugin) => {
      if (p.uniform) {
        userUniformVitePlugins.push(...p.uniform);
      }
      if (p.components) {
        const components: any[] = [];

        if (!Array.isArray(p.components) && typeof p.components === "object") {
          const mapComponents: any[] = [];

          Object.keys(p.components).forEach((key) => {
            if (!p?.components?.[key]) {
              return;
            }

            const component = p.components[key];

            mapComponents.push({
              component,
              name: key,
            });
          });

          p.components = mapComponents;
        }

        if (Array.isArray(p.components)) {
          for (const component of p.components) {
            if (!component.component) {
              console.error("No component function");
              continue;
            }

            if (!component.name) {
              component.name = component.component.name;
            }

            if (!component.dist) {
              component.dist = p._pluginPkg + "/" + component.name;
              continue;
            }

            if (!component.name) {
              console.error("No component name");
              continue;
            }
          }

          components.push(...p.components);
        }

        componentPlugins.push(...components);
      }

      const head = p.head;
      if (head?.length && preloadSettings?.theme?.head) {
        preloadSettings.theme.head.push(...head);
      }

      if (p.markdown?.rehype) {
        userMarkdownPlugins.rehype.push(
          ...p.markdown?.rehype || []
        )
      }

      if (p.markdown?.remark) {
        userMarkdownPlugins.rehype.push(
          ...p.markdown?.remark || []
        )
      }

    });

    globalThis.__xydUserUniformVitePlugins = userUniformVitePlugins;
    globalThis.__xydUserMarkdownPlugins = userMarkdownPlugins;
    globalThis.__xydUserComponents = componentPlugins;
  }

  const respPluginDocs = await pluginDocs({
    ...options,
    appInit,
  });
  if (!respPluginDocs) {
    throw new Error("PluginDocs not found");
  }
  if (!respPluginDocs.settings) {
    throw new Error("Settings not found in respPluginDocs");
  }
  respPluginDocs.settings.plugins = [
    ...(respPluginDocs.settings?.plugins || []),
    ...(preloadSettings.plugins || []),
  ];

  if (respPluginDocs.settings?.theme) {
    respPluginDocs.settings.theme.head = [
      ...(respPluginDocs.settings?.theme?.head || []),
      ...(preloadSettings.theme?.head || []),
    ];
  }

  globalThis.__xydBasePath = respPluginDocs.basePath;
  globalThis.__xydSettings = respPluginDocs.settings;
  globalThis.__xydPagePathMapping = respPluginDocs.pagePathMapping;
  globalThis.__xydHasIndexPage = respPluginDocs.hasIndexPage;
  globalThis.__xydSettingsClone = JSON.parse(
    JSON.stringify(respPluginDocs.settings)
  ); // TODO: finish
  globalThis.__xydRawRouteFiles = {};

  // appearanceWebEditor(respPluginDocs.settings)

  if (respPluginDocs.settings.integrations?.diagrams) {
    if (!componentExists("diagrams")) {
      await componentsInstall("diagrams");
    }
  }

  await pluginLLMMarkdown(respPluginDocs);

  return {
    respPluginDocs,
    resolvedPlugins,
  };
}

function virtualComponentsPlugin() {
  return {
    name: "xyd-plugin-virtual-components",
    resolveId(id) {
      if (id === "virtual:xyd-user-components") {
        return id + ".jsx"; // Return the module with .jsx extension
      }
      return null;
    },
    async load(id) {
      if (id === "virtual:xyd-user-components.jsx") {
        const userComponents = globalThis.__xydUserComponents || [];

        // If we have components with dist paths, pre-bundle them at build time
        if (userComponents.length > 0 && userComponents[0]?.component) {
          // Generate imports for all components
          const imports = userComponents
            .map(
              (component, index) =>
                `import Component${index} from '${component.dist}';`
            )
            .join("\n");

          // Generate component objects for all components
          const componentObjects = userComponents
            .map(
              (component, index) =>
                `{
                                component: Component${index},
                                name: '${component.name}',
                                dist: '${component.dist}'
                            }`
            )
            .join(",\n                            ");

          // This will be resolved by Vite at build time
          return `
                        // Pre-bundled at build time - no async loading needed
                        ${imports}
                        
                        export const components = [
                            ${componentObjects}
                        ];
                    `;
        }

        // Fallback to runtime loading
        return `
                    export const components = globalThis.__xydUserComponents || []
                `;
      }
      return null;
    },
  };
}

export function virtualProvidersPlugin(settings: Settings): VitePlugin {
  return {
    name: "xyd-plugin-virtual-providers",
    enforce: "pre",
    resolveId(id) {
      if (id === "virtual:xyd-analytics-providers") {
        return id;
      }
    },
    async load(id) {
      if (id === "virtual:xyd-analytics-providers") {
        const providers = Object.keys(settings?.integrations?.analytics || {});
        const imports = providers
          .map(
            (provider) =>
              `import { default as ${provider}Provider } from '@pluganalytics/provider-${provider}'`
          )
          .join("\n");

        const cases = providers
          .map((provider) => `case '${provider}': return ${provider}Provider`)
          .join("\n");

        return `
                    ${imports}

                    export const loadProvider = async (provider) => {
                        switch (provider) {
                            ${cases}
                            default:
                                console.error(\`Provider \${provider} not found\`)
                                return null
                        }
                    }
                `;
      }
    },
  };
}

export function virtualScriptsPlugin(settings: Settings): VitePlugin {
  return {
    name: "xyd-plugin-virtual-scripts",
    enforce: "pre",
    resolveId(id) {
      if (id === "virtual:xyd-scripts") {
        return id;
      }
    },
    async load(id) {
      if (id === "virtual:xyd-scripts") {
        const scripts = settings?.theme?.scripts || [];

        if (scripts.length === 0) {
          return `// No scripts configured`;
        }

        // Generate imports for all scripts (side effects only)
        const imports = scripts
          .map((script) => `import '${script}';`)
          .join("\n");

        return `
// Auto-generated imports from settings.theme.scripts
${imports}
        `;
      }
    },
  };
}

export async function commonVitePlugins(
  respPluginDocs: PluginOutput,
  resolvedPlugins: PluginConfig[]
) {
  const userVitePlugins = resolvedPlugins.map((p) => p.vite).flat() || [];

  return [
    ...((await xydContentVitePlugins({
      toc: {
        maxDepth: respPluginDocs.settings.theme?.writer?.maxTocDepth || 2,
      },
      settings: respPluginDocs.settings,
    })) as VitePlugin[]),
    ...respPluginDocs.vitePlugins,

    reactRouter(),

    virtualComponentsPlugin(),
    virtualProvidersPlugin(respPluginDocs.settings),
    virtualScriptsPlugin(respPluginDocs.settings),
    pluginIconSet(respPluginDocs.settings),
    ...userVitePlugins,
  ];
}

export async function pluginLLMMarkdown(respPluginDocs: PluginOutput) {
  const paths = Object.keys(globalThis.__xydPagePathMapping || {});
  const rawRouteFiles: { [path: string]: string } = {};
  const llmsItems: ListItem[] = [];

  for (const key of paths) {
    const mappingPath = globalThis.__xydPagePathMapping[key];
    const savePath = path.join(process.cwd(), mappingPath);
    const savePathExt = path.extname(savePath);

    if (savePathExt === ".md" || savePathExt === ".mdx") {
      try {
        await fsPromises.stat(savePath);
      } catch (e) {
        continue;
      }

      const content = await fsPromises.readFile(savePath, "utf8");
      // Ensure key starts with slash and has extension
      const formattedKey = normalizePath(key);
      const keyWithExt = formattedKey.endsWith(savePathExt)
        ? formattedKey
        : `${formattedKey}${savePathExt}`;
      rawRouteFiles[keyWithExt] = content;

      // Parse frontmatter and create AST node
      const listItem = await parseFrontmatterAndCreateAST(
        respPluginDocs.settings,
        content,
        keyWithExt
      );
      if (listItem) {
        llmsItems.push(listItem);
      }
    }
  }

  if (respPluginDocs.settings?.ai?.llmsTxt !== false) {
    let foundUserLLMsTxt = false;

    for (const pth of lookupPaths("llms.txt")) {
      const exists = fs.existsSync(pth);
      if (!exists) {
        continue;
      }

      const llmContent = fs.readFileSync(pth, "utf8");
      rawRouteFiles["/llms.txt"] = llmContent;
      foundUserLLMsTxt = true;
      break;
    }

    if (
      !foundUserLLMsTxt &&
      (llmsItems.length > 0 || respPluginDocs.settings?.ai?.llmsTxt)
    ) {
      const llmsContent = buildLLMsMarkdownAST(
        respPluginDocs.settings,
        rawRouteFiles,
        llmsItems
      );

      rawRouteFiles["/llms.txt"] = llmsContent;
    }
  }

  globalThis.__xydRawRouteFiles = {
    ...globalThis.__xydRawRouteFiles,
    ...rawRouteFiles,
  };
}

function normalizePath(p: string) {
  const formattedKey = p.startsWith("/") ? p : `/${p}`;

  return formattedKey;
}

export function commonPostInstallVitePlugins(
  respPluginDocs: PluginOutput,
  resolvedPlugins: PluginConfig[]
) {
  return [vitePluginThemePresets(respPluginDocs.settings)];
}

export async function vitePluginThemePresets(settings: Settings) {
  const themeName = settings.theme?.name;
  const VIRTUAL_ID = "virtual:xyd-theme-presets";
  const RESOLVED_ID = "\0" + VIRTUAL_ID;

  // Resolve theme folder using Node APIs
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  let themeRoot = "";
  if (process.env.XYD_CLI) {
    themeRoot = path.join(
      getHostPath(),
      `node_modules/@xyd-js/theme-${themeName}/dist`
    );
  } else {
    themeRoot = path.join(
      path.resolve(__dirname, "../../"),
      `xyd-theme-${themeName}/dist`
    );
  }

  const presetsDir = path.join(themeRoot, "presets");

  // Read available CSS files
  let cssFiles: string[] = [];
  try {
    const files = fs.readdirSync(presetsDir);
    cssFiles = files.filter((f) => f.endsWith(".css"));
  } catch (err) {}

  // Build import statements and map entries
  const importStmts: string[] = [];
  const mapEntries: string[] = [];

  cssFiles.forEach((file, index) => {
    const name = file.replace(/\.css$/, "");
    const varName = `preset${index}`;
    const pkgPath = `@xyd-js/theme-${themeName}/presets/${file}`;

    importStmts.push(`import ${varName} from '${pkgPath}?url';`);
    mapEntries.push(`  '${name}': ${varName}`);
  });

  return {
    name: "xyd:virtual-theme-presets",

    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },

    load(id) {
      if (id !== RESOLVED_ID) return null;

      return `
${importStmts.join("\n")}

export const presetUrls = {
${mapEntries.join(",\n")}
};
`;
    },
  };
}

export function pluginIconSet(settings: Settings): VitePlugin {
  const DEFAULT_ICON_SET = "lucide";

  async function fetchIconSet(
    name: string,
    version?: string
  ): Promise<{ icons: any; iconSet: IconSet }> {
    // If it's a URL, use it directly
    if (name.startsWith("http://") || name.startsWith("https://")) {
      try {
        const iconsResp = await fetch(name);
        const iconsData = await iconsResp.json();
        const iconSet = new IconSet(iconsData);
        return { icons: iconsData, iconSet };
      } catch (error) {
        console.warn(`Failed to fetch from URL ${name}:`, error);
      }
    }

    // Try to read from file system
    const tryReadFile = (filePath: string) => {
      try {
        if (!fs.existsSync(filePath)) {
          console.warn(`File does not exist: ${filePath}`);
          return null;
        }
        const fileContent = fs.readFileSync(filePath, "utf-8");
        try {
          const iconsData = JSON.parse(fileContent);
          const iconSet = new IconSet(iconsData);
          return { icons: iconsData, iconSet };
        } catch (parseError) {
          console.warn(`Invalid JSON in file ${filePath}:`, parseError);
          return null;
        }
      } catch (error) {
        console.warn(`Failed to read file ${filePath}:`, error);
        return null;
      }
    };

    if (path.isAbsolute(name)) {
      const result = tryReadFile(name);
      if (result) return result;
    }

    if (name.startsWith(".")) {
      const fullPath = path.join(process.cwd(), name);
      const result = tryReadFile(fullPath);
      if (result) return result;
    }

    // Fallback to CDN
    const cdnUrl = version
      ? `https://cdn.jsdelivr.net/npm/@iconify-json/${name}@${version}/icons.json`
      : `https://cdn.jsdelivr.net/npm/@iconify-json/${name}/icons.json`;

    try {
      const iconsResp = await fetch(cdnUrl);
      const iconsData = await iconsResp.json();
      const iconSet = new IconSet(iconsData);
      return { icons: iconsData, iconSet };
    } catch (error) {
      throw new Error(
        `Failed to load icon set from any source (file or CDN): ${name}`
      );
    }
  }

  async function processIconSet(
    iconSet: IconSet,
    icons: any,
    noPrefix?: boolean
  ): Promise<
    Map<
      string,
      {
        svg: string;
      }
    >
  > {
    const resp = new Map<string, { svg: string }>();

    for (const icon of Object.keys(icons.icons)) {
      const svg = iconSet.toSVG(icon);
      if (!svg) continue;

      let prefix = noPrefix ? undefined : iconSet.prefix;
      // If prefix is undefined, it means this is the default set and should not have a prefix
      const iconName = prefix ? `${prefix}:${icon}` : icon;
      resp.set(iconName, { svg: svg.toString() });
    }

    return resp;
  }

  async function addIconsToMap(
    resp: Map<
      string,
      {
        svg: string;
      }
    >,
    name: string,
    version?: string,
    noPrefix?: boolean
  ): Promise<void> {
    const { icons, iconSet } = await fetchIconSet(name, version);
    const newIcons = await processIconSet(iconSet, icons, noPrefix);
    newIcons.forEach((value, key) => resp.set(key, value));
  }

  async function processIconLibrary(
    library: string | IconLibrary | (string | IconLibrary)[]
  ): Promise<
    Map<
      string,
      {
        svg: string;
      }
    >
  > {
    const resp = new Map<string, { svg: string }>();

    if (typeof library === "string") {
      // Single icon set as default
      await addIconsToMap(resp, library);
    } else if (Array.isArray(library)) {
      // Multiple icon sets
      for (const item of library) {
        if (typeof item === "string") {
          // String items are treated as default set
          await addIconsToMap(resp, item);
        } else {
          // IconLibrary configuration
          const { name, version, default: isDefault, noprefix } = item;
          const noPrefix = isDefault || noprefix === true;
          await addIconsToMap(resp, name, version, noPrefix);
        }
      }
    } else {
      // Single IconLibrary configuration
      const { name, version, default: isDefault, noprefix } = library;
      const noPrefix = isDefault || noprefix === true;
      await addIconsToMap(resp, name, version, noPrefix);
    }

    return resp;
  }

  return {
    name: "xyd-plugin-icon-set",
    enforce: "pre",
    resolveId(id) {
      if (id === "virtual:xyd-icon-set") {
        return id;
      }
    },
    async load(id) {
      if (id === "virtual:xyd-icon-set") {
        let resp: Map<string, { svg: string }>;

        // Handle theme icons configuration
        if (settings.theme?.icons?.library) {
          resp = await processIconLibrary(settings.theme.icons.library);
        } else {
          resp = await processIconLibrary([
            {
              name: DEFAULT_ICON_SET,
              default: true,
            },
          ]);
        }

        return `
                    export const iconSet = ${JSON.stringify(Object.fromEntries(resp))};
                `;
      }
    },
  } as VitePlugin;
}

export function getXydFolderPath() {
  return path.join(process.cwd(), XYD_FOLDER_PATH);
}

export function getCLIRoot(): string {
  const cliPath = realpathSync(process.argv[1]);

  return path.dirname(path.dirname(cliPath));
}

export function getCLIComponentsJsonPath(): string {
  return path.join(getCLIRoot(), "cliComponents.json");
}

export function componentExists(component: string): boolean {
  const cliComponentsJson = getCLIComponentsJsonPath();

  try {
    const components = JSON.parse(fs.readFileSync(cliComponentsJson, "utf8"));
    return components[component] === true;
  } catch (error) {
    return false;
  }
}

export function getHostPath() {
  if (process.env.XYD_DEV_MODE) {
    if (process.env.XYD_HOST) {
      return path.resolve(process.env.XYD_HOST);
    }

    return path.join(__dirname, "../../../", HOST_FOLDER_PATH);
  }

  return path.join(process.cwd(), HOST_FOLDER_PATH);
}

export function getAppRoot() {
  return getHostPath();
}

// TODO: in the future get from settings
export function getPublicPath() {
  return path.join(process.cwd(), "public");
}

export function getBuildPath() {
  return path.join(process.cwd(), BUILD_FOLDER_PATH);
}

export function getBuildRoot() {
  return path.join(process.cwd(), XYD_FOLDER_PATH);
}

export function getStartPath() {
  return process.cwd();
}

export function getDocsPluginBasePath() {
  return path.join(getHostPath(), "./plugins/xyd-plugin-docs");
}

interface LoadedPlugin extends PluginConfig {
  _pluginPkg: string;
}

async function loadPlugins(settings: Settings, options?: PluginDocsOptions) {
  const resolvedPlugins: LoadedPlugin[] = [];

  if (settings.plugins?.length && !options?.doNotInstallPluginDependencies) {
    await setupPluginDependencies(settings, true);
  }

  const pluginSettingsFreeze = deepCloneAndFreeze(settings);

  for (const plugin of settings.plugins || []) {
    let pluginName: string;
    let pluginArgs: any[] = [];

    if (typeof plugin === "string") {
      pluginName = plugin;
      pluginArgs = [];
    } else if (Array.isArray(plugin)) {
      pluginName = plugin[0];
      pluginArgs = plugin.slice(1);
    } else {
      console.error(
        `Currently only string and array plugins are supported, got: ${plugin}`
      );
      return [];
    }

    let mod: any; // TODO: fix type

    // if local plugin
    if (pluginName?.startsWith("./")) {
      try {
        pluginName = path.join(process.cwd(), pluginName);

        // TODO: find better solution? use this every time?
        const pluginPreview = await createServer({
          optimizeDeps: {
            include: [],
          },
        });
        mod = await pluginPreview.ssrLoadModule(pluginName);
      } catch (e) {}
    } else {
      try {
        mod = await import(pluginName);
      } catch (e) {
        pluginName = path.join(
          process.cwd(),
          ".xyd/host/node_modules",
          pluginName
        );

        // TODO: find better solution? use this every time?
        const pluginPreview = await createServer({
          optimizeDeps: {
            include: [],
          },
        });
        mod = await pluginPreview.ssrLoadModule(pluginName);
      }
    }

    if (!mod.default) {
      console.error(`Plugin ${plugin} has no default export`);
      continue;
    }

    let pluginInstance = mod.default(...pluginArgs) as PluginConfig | Plugin;
    if (typeof pluginInstance === "function") {
      const plug = pluginInstance(pluginSettingsFreeze);

      resolvedPlugins.push({
        ...plug,
        _pluginPkg: pluginName,
      });

      continue;
    }

    resolvedPlugins.push({
      ...pluginInstance,
      _pluginPkg: pluginName,
    });
  }

  return resolvedPlugins;
}

function deepCloneAndFreeze(obj) {
  if (obj === null || typeof obj !== "object") return obj;

  const clone = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      clone[key] = deepCloneAndFreeze(obj[key]);
    }
  }

  return Object.freeze(clone);
}

function integrationsToPlugins(integrations: Integrations) {
  const plugins: Plugins = [];
  let foundSearchIntegation = 0;

  if (integrations?.search?.orama) {
    if (typeof integrations.search.orama === "boolean") {
      plugins.push("@xyd-js/plugin-orama");
    } else {
      plugins.push(["@xyd-js/plugin-orama", integrations.search.orama]);
    }
    foundSearchIntegation++;
  }

  if (integrations?.search?.algolia) {
    plugins.push(["@xyd-js/plugin-algolia", integrations.search.algolia]);
    foundSearchIntegation++;
  }

  if (foundSearchIntegation > 1) {
    throw new Error("Only one search integration is allowed");
  }

  if (integrations?.[".apps"]?.supademo) {
    plugins.push(["@xyd-js/plugin-supademo", integrations[".apps"].supademo]);
  }

  if (integrations?.support?.chatwoot) {
    plugins.push(["@xyd-js/plugin-chatwoot", integrations.support.chatwoot]);
  }

  if (integrations?.support?.intercom) {
    plugins.push(["@xyd-js/plugin-intercom", integrations.support.intercom]);
  }

  if (integrations?.support?.livechat) {
    plugins.push(["@xyd-js/plugin-livechat", integrations.support.livechat]);
  }

  return plugins;
}

export async function preWorkspaceSetup(
  options: {
    force?: boolean;
  } = {}
) {
  await ensureFoldersExist();

  // Check if we can skip the setup
  if (!options.force) {
    if (await shouldSkipHostSetup()) {
      return true;
    }
  }

  const hostTemplate = process.env.XYD_DEV_MODE
    ? path.resolve(__dirname, "../../xyd-host")
    : path.resolve(__dirname, "../../host");

  const hostPath = getHostPath();

  await copyHostTemplate(hostTemplate, hostPath);

  // Calculate and store new checksum after setup

  // Handle plugin-docs pages
  let pluginDocsPath: string | Error;
  if (process.env.XYD_DEV_MODE) {
    pluginDocsPath = path.resolve(__dirname, "../../xyd-plugin-docs");
  } else {
    pluginDocsPath = path.resolve(__dirname, "../../plugin-docs");
  }

  const pagesSourcePath = path.join(pluginDocsPath, "src/pages");
  const pagesTargetPath = path.join(
    hostPath,
    "plugins/xyd-plugin-docs/src/pages"
  );

  if (fs.existsSync(pagesSourcePath)) {
    await copyHostTemplate(pagesSourcePath, pagesTargetPath);
  } else {
    console.warn(`Pages source path does not exist: ${pagesSourcePath}`);
  }
}

export function calculateFolderChecksum(folderPath: string): string {
  const hash = crypto.createHash("sha256");
  const ignorePatterns = [
    ...getGitignorePatterns(folderPath),
    ".xydchecksum",
    "node_modules",
    "dist",
    ".react-router",
    "package-lock.json",
    "pnpm-lock.yaml",
    "cliComponents.json",
  ];

  function processFile(filePath: string) {
    const relativePath = path.relative(folderPath, filePath);
    const content = fs.readFileSync(filePath);
    hash.update(relativePath);
    hash.update(content);
  }

  function processDirectory(dirPath: string) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    // Sort entries to ensure consistent order
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const sourceEntry = path.join(dirPath, entry.name);

      // Skip if the entry matches any ignore pattern
      if (shouldIgnoreEntry(entry.name, ignorePatterns)) {
        continue;
      }

      // Skip .git directory
      if (entry.name === ".git") {
        continue;
      }

      if (entry.isDirectory()) {
        processDirectory(sourceEntry);
      } else {
        processFile(sourceEntry);
      }
    }
  }

  processDirectory(folderPath);
  return hash.digest("hex");
}

// TODO: xyd-host .gitignore is not copied to npm registry
function getGitignorePatterns(folderPath: string): string[] {
  const gitignorePath = path.join(folderPath, ".gitignore");
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, "utf-8");
    return gitignoreContent
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));
  }
  return [];
}

function shouldIgnoreEntry(
  entryName: string,
  ignorePatterns: string[]
): boolean {
  return ignorePatterns.some((pattern) => {
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));
    return regex.test(entryName);
  });
}

async function copyHostTemplate(sourcePath: string, targetPath: string) {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Host template source path does not exist: ${sourcePath}`);
  }

  // Clean target directory if it exists
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }

  // Create target directory
  fs.mkdirSync(targetPath, { recursive: true });

  const ignorePatterns = getGitignorePatterns(sourcePath);

  // Copy all files and directories recursively
  const entries = fs.readdirSync(sourcePath, { withFileTypes: true });

  for (const entry of entries) {
    const sourceEntry = path.join(sourcePath, entry.name);
    const targetEntry = path.join(targetPath, entry.name);

    // Skip if the entry matches any ignore pattern
    if (shouldIgnoreEntry(entry.name, ignorePatterns)) {
      continue;
    }

    // Skip .git directory
    if (entry.name === ".git") {
      continue;
    }

    if (entry.isDirectory()) {
      await copyHostTemplate(sourceEntry, targetEntry);
    } else {
      fs.copyFileSync(sourceEntry, targetEntry);

      // Handle package.json modifications for local development
      if (entry.name === "package.json" && process.env.XYD_DEV_MODE) {
        const packageJsonPath = targetEntry;
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf-8")
        );
        packageJson.name = "xyd-host-dev";

        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      }
    }
  }
}

async function ensureFoldersExist() {
  const folders = [CACHE_FOLDER_PATH];
  for (const folder of folders) {
    const fullPath = path.resolve(process.cwd(), folder);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }
}

// TODO: in the future buil-in xyd plugins should be installable via code
export async function postWorkspaceSetup(settings: Settings) {
  const spinner = new CLI("dots");

  try {
    spinner.startSpinner("Installing xyd framework...");

    const hostPath = getHostPath();
    const packageJsonPath = path.join(hostPath, "package.json");
    const packageJson = await hostPackageJson();

    const integrationDeps = await setupIntegationDependencies(settings);
    const pluginDeps = await setupPluginDependencies(settings);

    packageJson.dependencies = {
      ...integrationDeps,
      ...packageJson.dependencies,
      ...pluginDeps,
    };

    // TODO: rename to plugins:["diagrams"]
    if (settings.integrations?.diagrams) {
      const componentDeps = componentDependencies(settings, "diagrams", true);

      if (componentDeps) {
        packageJson.dependencies = {
          ...packageJson.dependencies,
          ...componentDeps,
        };
      }
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    await nodeInstallPackages(hostPath);

    spinner.stopSpinner();
    spinner.log("✔ Local xyd framework installed successfully");
  } catch (error) {
    spinner.stopSpinner();
    spinner.error("❌ Failed to install xyd framework");
    throw error;
  }
}

async function hostPackageJson() {
  const hostPath = getHostPath();
  const packageJsonPath = path.join(hostPath, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    console.warn("No package.json found in host path");
    return;
  }

  let packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

  // Initialize dependencies if they don't exist
  if (!packageJson.dependencies) {
    packageJson.dependencies = {};
  }

  return packageJson;
}

async function setupIntegationDependencies(settings: Settings) {
  const dependencies = {};

  for (const [key, value] of Object.entries(
    ANALYTICS_INTEGRATION_DEPENDENCIES
  )) {
    const analytics = settings.integrations?.analytics?.[key];
    if (analytics) {
      for (const [depName, depVersion] of Object.entries(value)) {
        dependencies[depName] = depVersion;
      }
    }
  }

  return dependencies;
}

async function setupPluginDependencies(
  settings: Settings,
  install: boolean = false
) {
  const spinner = new CLI("dots");

  const hostPath = getHostPath();

  const dependencies = {};

  for (const plugin of settings.plugins || []) {
    let pluginName: string;

    if (typeof plugin === "string") {
      pluginName = plugin;
    } else if (Array.isArray(plugin)) {
      pluginName = plugin[0];
    } else {
      continue;
    }

    if (
      pluginName.startsWith("@xyd-js/") &&
      (!EXTERNAL_XYD_PLUGINS[pluginName] || process.env.XYD_DEV_MODE === "2")
    ) {
      continue; // TODO: currently we don't install built-in xyd plugins - they are defined in host
    }

    // Check if it's a valid npm package name
    // Valid formats: name or @scope/name
    // Invalid: ./path/to/file.js or /absolute/path
    const isValidNpmPackage =
      /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(pluginName);

    if (isValidNpmPackage) {
      const xydPluginVersion = EXTERNAL_XYD_PLUGINS[pluginName];

      // Search for matching dependencies in host's package.json
      const hostPackageJsonPath = path.join(hostPath, "package.json");

      const cwdPackageJsonPath = path.join(process.cwd(), "package.json");
      let userDeps = {};
      if (fs.existsSync(cwdPackageJsonPath)) {
        const cwdPackageJson = JSON.parse(
          fs.readFileSync(cwdPackageJsonPath, "utf-8")
        );
        userDeps = cwdPackageJson.dependencies || {};
      }

      if (fs.existsSync(hostPackageJsonPath)) {
        const hostPackageJson = JSON.parse(
          fs.readFileSync(hostPackageJsonPath, "utf-8")
        );
        const deps = hostPackageJson.dependencies || {};

        const matchingUserDep = Object.entries(userDeps).find(([depName]) => {
          return depName === pluginName;
        });

        // 1. first find in user deps
        if (matchingUserDep) {
          dependencies[pluginName] = matchingUserDep[1];
        } else {
          const matchingHostDep = Object.entries(deps).find(([depName]) => {
            return depName === pluginName;
          });

          // 2. if not found in user deps, find in host deps
          if (matchingHostDep) {
            dependencies[pluginName] = matchingHostDep[1];
          }
          // 3. if not found in host deps, use xyd plugin version
          else if (xydPluginVersion) {
            dependencies[pluginName] = xydPluginVersion;
          }
          // 4. otherwise use latest version
          else {
            dependencies[pluginName] = "latest";
          }
        }
      } else {
        console.warn(`no host package.json found in: ${hostPath}`);
      }
    } else if (!pluginName.startsWith(".") && !pluginName.startsWith("/")) {
      // Only warn if it's not a local file path (doesn't start with . or /)
      console.warn(`invalid plugin name: ${pluginName}`);
    }
  }

  if (install && Object.keys(dependencies).length) {
    spinner.startSpinner("Installing plugin dependencies...");

    const packageJson = await hostPackageJson();
    const packageJsonPath = path.join(hostPath, "package.json");
    packageJson.dependencies = {
      ...packageJson.dependencies,
      ...dependencies,
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    await nodeInstallPackages(hostPath);

    spinner.stopSpinner();
    spinner.log("✔ Plugin dependencies installed successfully");
  }

  return dependencies;
}

export function nodeInstallPackages(hostPath: string) {
  const cmdInstall = pmInstall();

  const execOptions: ExecSyncOptions = {
    cwd: hostPath,
    env: {
      ...process.env,
      NODE_ENV: "", // since 'production' does not install it well,
    },
  };
  const customRegistry =
    process.env.XYD_NPM_REGISTRY || process.env.npm_config_registry;
  if (customRegistry) {
    if (!execOptions.env) {
      execOptions.env = {};
    }
    execOptions.env["npm_config_registry"] = customRegistry;
  }

  if (process.env.XYD_VERBOSE) {
    execOptions.stdio = "inherit";
  }

  execSync(cmdInstall, execOptions);
}

export function pmInstall() {
  if (process.env.XYD_NODE_PM) {
    switch (process.env.XYD_NODE_PM) {
      case "npm": {
        return npmInstall();
      }
      case "pnpm": {
        return pnpmInstall();
      }
      case "bun": {
        return bunInstall();
      }
      default: {
        console.warn(
          `Unknown package manager: ${process.env.XYD_NODE_PM}, falling back to npm`
        );
        return npmInstall();
      }
    }
  }

  if (hasBun()) {
    return bunInstall();
  }

  const { pnpm } = runningPm();

  console.log("ℹ️ consider install `bun` for better performance \n");

  if (pnpm) {
    return pnpmInstall();
  }

  return npmInstall();
}

function hasBun(): boolean {
  try {
    execSync("bun --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function runningPm() {
  let pnpm = false;
  let bun = false;

  // Detect package manager from npm_execpath
  if (process.env.npm_execpath) {
    if (process.env.npm_execpath.includes("pnpm")) {
      pnpm = true;
    } else if (process.env.npm_execpath.includes("bun")) {
      bun = true;
    }
  }

  if (process.env.NODE_PATH) {
    const nodePath = process.env.NODE_PATH;

    if (nodePath.includes(".pnpm")) {
      pnpm = true;
    } else if (nodePath.includes(".bun")) {
      bun = true;
    }
  }

  if (
    process.execPath.includes("bun") ||
    path.dirname(process.argv?.[1] || "").includes("bun")
  ) {
    bun = true;
  }

  return {
    pnpm,
    bun,
  };
}

function pnpmInstall() {
  return "pnpm install";
}

function bunInstall() {
  return "bun install";
}

function npmInstall() {
  return "npm install";
}

export async function shouldSkipHostSetup(): Promise<boolean> {
  const hostPath = getHostPath();

  // If host folder doesn't exist, we need to set it up
  if (!fs.existsSync(hostPath)) {
    return false;
  }

  const currentChecksum = calculateFolderChecksum(hostPath);
  const storedChecksum = getStoredChecksum();

  // If no stored checksum or checksums don't match, we need to set up
  if (!storedChecksum || storedChecksum !== currentChecksum) {
    return false;
  }

  return true;
}

function getStoredChecksum(): string | null {
  const checksumPath = path.join(getHostPath(), ".xydchecksum");
  if (!fs.existsSync(checksumPath)) {
    return null;
  }
  try {
    return fs.readFileSync(checksumPath, "utf-8").trim();
  } catch (error) {
    console.error("Error reading checksum file:", error);
    return null;
  }
}

function lookupPaths(value: string): string[] {
  const basePath = (globalThis as any).__xydBasePath;
  const tryPaths: string[] = [];

  if (path.isAbsolute(value)) {
    tryPaths.push(value);
  } else {
    tryPaths.push(
      path.join(process.cwd(), value),
      path.join(process.cwd(), "public", value),
      path.join(getAppRoot(), value),
      path.join(getHostPath(), value)
    );
    if (typeof basePath === "string" && basePath) {
      tryPaths.push(path.join(basePath, value));
    }
  }

  return tryPaths;
}

export function storeChecksum(checksum: string): void {
  const checksumPath = path.join(getHostPath(), ".xydchecksum");
  try {
    fs.writeFileSync(checksumPath, checksum);
  } catch (error) {
    console.error("Error writing checksum file:", error);
  }
}
