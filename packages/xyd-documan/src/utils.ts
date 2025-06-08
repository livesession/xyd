import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import crypto from "node:crypto";

import { createServer, PluginOption as VitePluginOption, Plugin as VitePlugin } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import { IconSet } from '@iconify/tools';

import { readSettings, pluginDocs, type PluginDocsOptions, PluginOutput } from "@xyd-js/plugin-docs";
import { vitePlugins as xydContentVitePlugins } from "@xyd-js/content/vite";
import { Integrations, Plugins, Settings } from "@xyd-js/core";
import type { IconLibrary } from "@xyd-js/core";
import type { Plugin, PluginConfig } from "@xyd-js/plugins";
import { type UniformPlugin } from "@xyd-js/uniform";

import { BUILD_FOLDER_PATH, CACHE_FOLDER_PATH, HOST_FOLDER_PATH } from "./const";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HOST_VERSION = "0.1.0-xyd.0"

interface IconifyIcon {
    body: string;
    width: number;
    height: number;
}

export async function appInit(options?: PluginDocsOptions) {
    const readPreloadSettings = await readSettings() // TODO: in the future better solution - currently we load settings twice (pluginDocs and here)
    if (!readPreloadSettings) {
        throw new Error("cannot preload settings")
    }

    const preloadSettings = typeof readPreloadSettings === "string" ? JSON.parse(readPreloadSettings) : readPreloadSettings

    {
        if (!preloadSettings.integrations?.search) {
            preloadSettings.integrations = {
                ...(preloadSettings.integrations || {}),
                search: {
                    orama: true
                }
            }
        }

        const plugins = integrationsToPlugins(preloadSettings.integrations)
        if (preloadSettings.plugins) {
            preloadSettings.plugins = [...plugins, ...preloadSettings.plugins]
        } else {
            preloadSettings.plugins = plugins
        }
    }

    let resolvedPlugins: PluginConfig[] = []
    {
        resolvedPlugins = await loadPlugins(preloadSettings) || []
        const userUniformVitePlugins: UniformPlugin<any>[] = []

        resolvedPlugins?.forEach(p => {
            if (p.uniform) {
                userUniformVitePlugins.push(...p.uniform)
            }
        })
        globalThis.__xydUserUniformVitePlugins = userUniformVitePlugins
    }

    const respPluginDocs = await pluginDocs(options)
    if (!respPluginDocs) {
        throw new Error("PluginDocs not found")
    }
    if (!respPluginDocs.settings) {
        throw new Error("Settings not found in respPluginDocs")
    }
    respPluginDocs.settings.plugins = [
        ...(respPluginDocs.settings?.plugins || []),
        ...(preloadSettings.plugins || [])
    ]

    globalThis.__xydBasePath = respPluginDocs.basePath
    globalThis.__xydSettings = respPluginDocs.settings
    globalThis.__xydPagePathMapping = respPluginDocs.pagePathMapping

    return {
        respPluginDocs,
        resolvedPlugins
    }
}

export function virtualComponentsPlugin(): VitePluginOption {
    return {
        name: 'xyd-plugin-virtual-components',
        enforce: 'pre',
        config: () => {
            const componentsDist = path.resolve(getHostPath(), "./node_modules/@xyd-js/components/dist")

            return {
                resolve: {
                    alias: {
                        // TODO: type-safe virtual-components
                        'virtual-component:Search': path.resolve(componentsDist, "system.js")
                    }
                }
            }
        },
    }
}

export function virtualProvidersPlugin(
    settings: Settings
): VitePluginOption {
    return {
        name: 'xyd-plugin-virtual-providers',
        enforce: 'pre',
        resolveId(id) {
            if (id === 'virtual:xyd-analytics-providers') {
                return id
            }
        },
        async load(id) {
            if (id === 'virtual:xyd-analytics-providers') {
                const providers = Object.keys(settings?.integrations?.analytics || {})
                const imports = providers.map(provider =>
                    `import { default as ${provider}Provider } from '@pluganalytics/provider-${provider}'`
                ).join('\n')

                const cases = providers.map(provider =>
                    `case '${provider}': return ${provider}Provider`
                ).join('\n')

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
                `
            }
        }
    }
}

export function commonVitePlugins(
    respPluginDocs: PluginOutput,
    resolvedPlugins: PluginConfig[],
) {
    const userVitePlugins = resolvedPlugins.map(p => p.vite).flat() || []

    return [
        ...(xydContentVitePlugins({
            toc: {
                maxDepth: respPluginDocs.settings.theme?.maxTocDepth || 2,
            },
            settings: respPluginDocs.settings,
        }) as VitePlugin[]),
        ...respPluginDocs.vitePlugins,

        reactRouter(),

        virtualComponentsPlugin(),
        virtualProvidersPlugin(respPluginDocs.settings),
        pluginIconSet(respPluginDocs.settings),

        ...userVitePlugins,
    ]
}

export function pluginIconSet(settings: Settings): VitePluginOption {
    const DEFAULT_ICON_SET = "lucide";

    async function fetchIconSet(name: string, version?: string): Promise<{ icons: any, iconSet: IconSet }> {
        // If it's a URL, use it directly
        if (name.startsWith('http://') || name.startsWith('https://')) {
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
                const fileContent = fs.readFileSync(filePath, 'utf-8');
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
            throw new Error(`Failed to load icon set from any source (file or CDN): ${name}`);
        }
    }

    async function processIconSet(iconSet: IconSet, icons: any, noPrefix?: boolean): Promise<Map<string, { svg: string }>> {
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

    async function addIconsToMap(resp: Map<string, { svg: string }>, name: string, version?: string, noPrefix?: boolean): Promise<void> {
        const { icons, iconSet } = await fetchIconSet(name, version);
        const newIcons = await processIconSet(iconSet, icons, noPrefix);
        newIcons.forEach((value, key) => resp.set(key, value));
    }

    async function processIconLibrary(library: string | IconLibrary | (string | IconLibrary)[]): Promise<Map<string, { svg: string }>> {
        const resp = new Map<string, { svg: string }>();

        if (typeof library === 'string') {
            // Single icon set as default
            await addIconsToMap(resp, library);
        } else if (Array.isArray(library)) {
            // Multiple icon sets
            for (const item of library) {
                if (typeof item === 'string') {
                    // String items are treated as default set
                    await addIconsToMap(resp, item);
                } else {
                    // IconLibrary configuration
                    const { name, version, default: isDefault, noprefix } = item;
                    const noPrefix = isDefault || noprefix;
                    await addIconsToMap(resp, name, version, noPrefix);
                }
            }
        } else {
            // Single IconLibrary configuration
            const { name, version, default: isDefault, noprefix } = library;
            const prefix = (isDefault || noprefix) ? undefined : name;
            await addIconsToMap(resp, name, version, prefix);
        }

        return resp;
    }

    return {
        name: 'xyd-plugin-icon-set',
        enforce: 'pre',
        resolveId(id) {
            if (id === 'virtual:xyd-icon-set') {
                return id;
            }
        },
        async load(id) {
            if (id === 'virtual:xyd-icon-set') {
                let resp: Map<string, { svg: string }>;

                // Handle theme icons configuration
                if (settings.theme?.icons?.library) {
                    resp = await processIconLibrary(settings.theme.icons.library);
                } else {
                    // If no icons configured, use default
                    resp = new Map<string, { svg: string }>();
                    await addIconsToMap(resp, DEFAULT_ICON_SET);
                }

                return `
                    export const iconSet = ${JSON.stringify(Object.fromEntries(resp))};
                `;
            }
        }
    } as VitePlugin
}

export function getHostPath() {
    if (process.env.XYD_DEV_MODE) {
        if (process.env.XYD_HOST) {
            return path.resolve(process.env.XYD_HOST)
        }


        return path.join(__dirname, "../../../", HOST_FOLDER_PATH)
    }

    return path.join(process.cwd(), HOST_FOLDER_PATH)
}

export function getAppRoot() {
    return getHostPath()
}

// TODO: in the future get from settings
export function getPublicPath() {
    return path.join(process.cwd(), 'public')
}

export function getBuildPath() {
    return path.join(
        process.cwd(),
        BUILD_FOLDER_PATH
    );
}

export function getDocsPluginBasePath() {
    return path.join(getHostPath(), "./plugins/xyd-plugin-docs")
}

async function loadPlugins(
    settings: Settings,
) {
    const resolvedPlugins: PluginConfig[] = []

    for (const plugin of settings.plugins || []) {
        let pluginName: string
        let pluginArgs: any[] = []

        if (typeof plugin === "string") {
            pluginName = plugin
            pluginArgs = []
        } else if (Array.isArray(plugin)) {
            pluginName = plugin[0]
            pluginArgs = plugin.slice(1)
        } else {
            console.error(`Currently only string and array plugins are supported, got: ${plugin}`)
            return []
        }

        let mod: any // TODO: fix type
        try {
            mod = await import(pluginName)
        } catch (e) {
            pluginName = path.join(process.cwd(), pluginName)

            // TODO: find better solution? use this every time?
            const pluginPreview = await createServer({
                optimizeDeps: {
                    include: [],
                },
            });
            mod = await pluginPreview.ssrLoadModule(pluginName);
        }

        if (!mod.default) {
            console.error(`Plugin ${plugin} has no default export`)
            continue
        }

        let pluginInstance = mod.default(...pluginArgs) as (PluginConfig | Plugin)
        if (typeof pluginInstance === "function") {
            const plug = pluginInstance(settings)

            resolvedPlugins.push(plug)

            continue
        }

        resolvedPlugins.push(pluginInstance);

    }

    return resolvedPlugins
}

function integrationsToPlugins(integrations: Integrations) {
    const plugins: Plugins = []
    let foundSearchIntegation = 0

    if (integrations?.search?.orama) {
        if (typeof integrations.search.orama === "boolean") {
            plugins.push("@xyd-js/plugin-orama")
        } else {
            plugins.push(["@xyd-js/plugin-orama", integrations.search.orama])
        }
        foundSearchIntegation++
    }

    if (integrations?.search?.algolia) {
        plugins.push(["@xyd-js/plugin-algolia", integrations.search.algolia])
        foundSearchIntegation++
    }

    if (foundSearchIntegation > 1) {
        throw new Error("Only one search integration is allowed")
    }

    return plugins
}

export async function preWorkspaceSetup(options: {
    force?: boolean
} = {}) {
    await ensureFoldersExist()

    // Check if we can skip the setup
    if (!options.force) {
        if (await shouldSkipHostSetup()) {
            return true
        }
    }

    const hostTemplate = process.env.XYD_DEV_MODE
        ? path.resolve(__dirname, "../../xyd-host")
        : await downloadPackage("@xyd-js/host", HOST_VERSION)

    if (hostTemplate instanceof Error) {
        throw hostTemplate
    }

    const hostPath = getHostPath()

    await copyHostTemplate(hostTemplate, hostPath)

    // Calculate and store new checksum after setup

    // Handle plugin-docs pages
    let pluginDocsPath: string | Error
    if (process.env.XYD_DEV_MODE) {
        pluginDocsPath = path.resolve(__dirname, "../../xyd-plugin-docs")
    } else {
        // Get plugin-docs version from host's package.json
        const hostPackageJsonPath = path.join(hostPath, 'package.json')
        if (fs.existsSync(hostPackageJsonPath)) {
            const hostPackageJson = JSON.parse(fs.readFileSync(hostPackageJsonPath, 'utf-8'))
            const pluginDocsVersion = hostPackageJson.dependencies?.['@xyd-js/plugin-docs']

            if (pluginDocsVersion) {
                pluginDocsPath = await downloadPackage('@xyd-js/plugin-docs', pluginDocsVersion)
            } else {
                console.warn('No @xyd-js/plugin-docs dependency found in host package.json')
                return
            }
        } else {
            console.warn('No host package.json found')
            return
        }
    }

    if (pluginDocsPath instanceof Error) {
        throw pluginDocsPath
    }

    const pagesSourcePath = path.join(pluginDocsPath, "src/pages")
    const pagesTargetPath = path.join(hostPath, "plugins/xyd-plugin-docs/src/pages")

    if (fs.existsSync(pagesSourcePath)) {
        console.debug(`Copying pages from: ${pagesSourcePath} to: ${pagesTargetPath}`)
        await copyHostTemplate(pagesSourcePath, pagesTargetPath)
    } else {
        console.warn(`Pages source path does not exist: ${pagesSourcePath}`)
    }
}

export function calculateFolderChecksum(folderPath: string): string {
    const hash = crypto.createHash('sha256');
    const ignorePatterns = [...getGitignorePatterns(folderPath), '.xydchecksum'];

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
            const sourceEntry = path.join(dirPath, entry.name)

            // Skip if the entry matches any ignore pattern
            if (shouldIgnoreEntry(entry.name, ignorePatterns)) {
                continue
            }

            // Skip .git directory
            if (entry.name === '.git') {
                continue
            }

            if (entry.isDirectory()) {
                processDirectory(sourceEntry)
            } else {
                processFile(sourceEntry)
            }
        }
    }

    processDirectory(folderPath);
    return hash.digest('hex');
}

function getGitignorePatterns(folderPath: string): string[] {
    const gitignorePath = path.join(folderPath, '.gitignore')
    if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8')
        return gitignoreContent
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'))
    }
    return []
}

function shouldIgnoreEntry(entryName: string, ignorePatterns: string[]): boolean {
    return ignorePatterns.some(pattern => {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'))
        return regex.test(entryName)
    })
}

async function downloadPackage(packageName: string, version: string): Promise<string | Error> {
    const tempDir = path.join(process.cwd(), CACHE_FOLDER_PATH, 'temp')
    const packageDir = path.join(tempDir, packageName.replace('/', '-'))

    // Clean up existing temp directory if it exists
    if (fs.existsSync(packageDir)) {
        fs.rmSync(packageDir, { recursive: true, force: true })
    }

    // Create temp directory
    fs.mkdirSync(packageDir, { recursive: true })

    try {
        nodeDownloadPackage(packageName, version, tempDir, packageDir)

        return packageDir
    } catch (error) {
        console.error(`Failed to download ${packageName}@${version}:`, error)
        return new Error(`Failed to download ${packageName}@${version}`)
    }
}

async function copyHostTemplate(sourcePath: string, targetPath: string) {
    if (!fs.existsSync(sourcePath)) {
        throw new Error(`Host template source path does not exist: ${sourcePath}`)
    }

    // Clean target directory if it exists
    if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { recursive: true, force: true })
    }

    // Create target directory
    fs.mkdirSync(targetPath, { recursive: true })

    const ignorePatterns = getGitignorePatterns(sourcePath)

    // Copy all files and directories recursively
    const entries = fs.readdirSync(sourcePath, { withFileTypes: true })

    for (const entry of entries) {
        const sourceEntry = path.join(sourcePath, entry.name)
        const targetEntry = path.join(targetPath, entry.name)

        // Skip if the entry matches any ignore pattern
        if (shouldIgnoreEntry(entry.name, ignorePatterns)) {
            continue
        }

        // Skip .git directory
        if (entry.name === '.git') {
            continue
        }

        if (entry.isDirectory()) {
            await copyHostTemplate(sourceEntry, targetEntry)
        } else {
            fs.copyFileSync(sourceEntry, targetEntry)

            // Handle package.json modifications for local development
            if (entry.name === 'package.json' && process.env.XYD_DEV_MODE) {
                const packageJsonPath = targetEntry
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
                packageJson.name = "xyd-host-dev"

                fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
            }
        }
    }
}

async function ensureFoldersExist() {
    const folders = [CACHE_FOLDER_PATH]
    for (const folder of folders) {
        const fullPath = path.resolve(process.cwd(), folder)
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true })
            console.debug(`Created folder: ${folder}`)
        }
    }
}

// TODO: in the future buil-in xyd plugins should be installable via code
export async function postWorkspaceSetup(settings: Settings) {
    const hostPath = getHostPath()
    const packageJsonPath = path.join(hostPath, 'package.json')

    if (!fs.existsSync(packageJsonPath)) {
        console.warn('No package.json found in host path')
        return
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

    // Initialize dependencies if they don't exist
    if (!packageJson.dependencies) {
        packageJson.dependencies = {}
    }
    for (const plugin of settings.plugins || []) {
        let pluginName: string

        if (typeof plugin === "string") {
            pluginName = plugin
        } else if (Array.isArray(plugin)) {
            pluginName = plugin[0]
        } else {
            continue
        }

        if (pluginName.startsWith("@xyd-js/")) {
            continue // TODO: currently we don't install built-in xyd plugins - they are defined in host
        }

        // Check if it's a valid npm package name
        // Valid formats: name or @scope/name
        // Invalid: ./path/to/file.js or /absolute/path
        const isValidNpmPackage = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(pluginName)

        if (isValidNpmPackage) {
            // Search for matching dependencies in host's package.json
            const hostPackageJsonPath = path.join(hostPath, 'package.json')
            if (fs.existsSync(hostPackageJsonPath)) {
                const hostPackageJson = JSON.parse(fs.readFileSync(hostPackageJsonPath, 'utf-8'))
                const deps = hostPackageJson.dependencies || {}

                // Find matching dependency
                const matchingDep = Object.entries(deps).find(([depName]) => {
                    return depName === pluginName
                })

                if (matchingDep) {
                    packageJson.dependencies[pluginName] = matchingDep[1]
                } else {
                    console.warn(`no matching dependency found for: ${pluginName} in: ${hostPackageJsonPath}`)
                }
            } else {
                console.warn(`no host package.json found in: ${hostPath}`)
            }
        } else if (!pluginName.startsWith('.') && !pluginName.startsWith('/')) {
            // Only warn if it's not a local file path (doesn't start with . or /)
            console.warn(`invalid plugin name: ${pluginName}`)
        }
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))

    nodeInstallPackages(hostPath)
}


function nodeInstallPackages(hostPath: string) {
    const cmd = process.env.XYD_DEV_MODE ? 'pnpm i' : 'npm i'
    execSync(cmd, {
        cwd: hostPath,
        stdio: 'inherit',
        env: {
            ...process.env,
            NODE_ENV: "" // since 'production' does not install it well
        }
    })
}

function nodeDownloadPackage(
    packageName: string,
    version: string,
    extractDir: string,
    finalOutputDir: string,
) {
    const cmd = process.env.XYD_DEV_MODE
        ? `pnpm pack ${packageName}@${version} --pack-destination ${extractDir}`
        : `npm pack ${packageName}@${version} --pack-destination ${extractDir}`

    execSync(cmd, { stdio: 'inherit' })

    const tarball = fs.readdirSync(extractDir).find(file => file.endsWith('.tgz'))
    if (!tarball) {
        throw new Error(`No tarball found for ${packageName}@${version}`)
    }
    execSync(`tar -xzf ${path.join(extractDir, tarball)} -C ${extractDir}`, { stdio: 'inherit' })

    // Move package contents to outputDir
    const extractedDir = path.join(extractDir, 'package')
    if (fs.existsSync(extractedDir)) {
        fs.renameSync(extractedDir, finalOutputDir)
    }

    // Clean up tarball
    fs.unlinkSync(path.join(extractDir, tarball))
}

async function shouldSkipHostSetup(): Promise<boolean> {
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
    const checksumPath = path.join(getHostPath(), '.xydchecksum');
    if (!fs.existsSync(checksumPath)) {
        return null;
    }
    try {
        return fs.readFileSync(checksumPath, 'utf-8').trim();
    } catch (error) {
        console.error('Error reading checksum file:', error);
        return null;
    }
}

export function storeChecksum(checksum: string): void {
    const checksumPath = path.join(getHostPath(), '.xydchecksum');
    try {
        fs.writeFileSync(checksumPath, checksum);
    } catch (error) {
        console.error('Error writing checksum file:', error);
    }
}

