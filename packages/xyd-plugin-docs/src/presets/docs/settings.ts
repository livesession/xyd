import fs from "fs/promises";
import path from "node:path";
import { URL, pathToFileURL } from "node:url";

import { config as dotenvConfig } from "dotenv";
import yaml from "js-yaml";

import { getThemeColors } from "./themeColors";

import { Settings } from "@xyd-js/core";
import { replaceEnvVars } from "@xyd-js/cli-sdk";

import { settingsNative } from "../../native";

const extensions = ["tsx", "ts", "json"];

/**
 * Reads `xyd` settings from the current working directory.
 *
 * This function searches for a file named 'xyd' with one of the supported extensions
 * (tsx, jsx, js, ts, json) in the current working directory. If found, it loads the
 * settings from that file.
 *
 * For React-based settings files (tsx, jsx, js, ts), it uses Vite's SSR module loading
 * to evaluate the file and extract the default export. For JSON files, it simply
 * parses the JSON content.
 *
 * Environment variables in the format $ENV_VAR will be replaced with actual environment
 * variable values. Environment variables are loaded from .env files before processing.
 *
 * @returns A Promise that resolves to:
 *   - The Settings object if a valid settings file was found and loaded
 *   - A string if the settings file contains a string value
 *   - null if no settings file was found or an error occurred
 *
 * @throws May throw errors if file reading or parsing fails
 */
export async function readSettings() {
    const dirPath = process.cwd();

    // Load environment variables from .env files first
    await loadEnvFiles(dirPath);

    const baseFileName = "docs";
    let settingsFilePath = "";
    let reactSettings = false;

    let error: string | null = null;
    try {
        const files = await fs.readdir(dirPath);
        const settingsFile = files.find((file) => {
            const ext = path.extname(file).slice(1);
            return file.startsWith(baseFileName) && extensions.includes(ext);
        });

        if (settingsFile) {
            settingsFilePath = path.join(dirPath, settingsFile);
            reactSettings = path.extname(settingsFile) !== ".json";
        } else {
            error =
                "No settings file found.\nFile must be named 'docs' with one of the following extensions: ${extensions.join(', ')}";
        }
    } catch (error) {
        console.error(error);
        return null;
    }

    let settings: Settings | null = null;

    if (!error) {
        if (reactSettings) {
            // Native ESM import — Bun transpiles TS/TSX directly, so we no longer
            // spin up Vite's SSR module loader to evaluate docs.ts/tsx (S0).
            const config = await import(pathToFileURL(settingsFilePath).href);
            const mod = config.default as Settings;

            settings = postLoadSetup(mod);
        } else {
            const rawJsonSettings = await fs.readFile(settingsFilePath, "utf-8");
            try {
                let json = JSON.parse(rawJsonSettings) as Settings;

                settings = postLoadSetup(json);
            } catch (e) {
                console.error("⚠️ Error parsing settings file");

                return null;
            }
        }
    }

    const fastServeSettings = await fastServeSetup(settings);
    if (fastServeSettings) {
        return fastServeSettings;
    }

    return settings;
}

// TODO: it's concept only
async function fastServeSetup(currentSettings: Settings | null) {
    const args = process.argv.slice(2);
    const [command, optionalFastServePath] = args;

    const fastServeMode =
        (command === "dev" || command === "build") && optionalFastServePath;
    if (!fastServeMode) {
        return null;
    }

    const extension = path.extname(optionalFastServePath).slice(1);

    let fastServeSettings: Settings = {
        theme: {
            name: "gusto",
            appearance: {
                //@ts-ignore
                search: false,
                colorScheme: false,
            },
        },
    };
    if (currentSettings) {
        fastServeSettings = deepMerge(fastServeSettings, currentSettings);
    }

    switch (extension) {
        case "yaml":
        case "yml": {
            if (await isOpenApiYaml(optionalFastServePath)) {
                fastServeSettings.api = {
                    openapi: optionalFastServePath,
                };

                return postLoadSetup(fastServeSettings);
            }
        }
        case "graphql":
        case "graphqls": {
            fastServeSettings.api = {
                graphql: optionalFastServePath,
            };

            return postLoadSetup(fastServeSettings);
        }
    }

    return null;
}

function postLoadSetup(settings: Settings) {
    // A 3rd-party build orchestrator (e.g. @xyd-js/vite-plugin) can pass the
    // mount path via XYD_BASENAME instead of duplicating it in the settings;
    // an explicit `advanced.basename` in the settings always wins. Injected
    // BEFORE the data plane so both the native (Rust) and JS preset paths see
    // it (ensureBasename derives logo/favicon prefixes from it).
    if (process.env.XYD_BASENAME && !settings?.advanced?.basename) {
        settings.advanced = { ...settings.advanced, basename: process.env.XYD_BASENAME };
    }

    // S6+ C-S5: the env substitution + sync presets data-plane runs in Rust
    // (crates/xyd_settings::process_settings) when the native core is present;
    // the JS branch below is the byte-identical fidelity reference + fallback.
    // XYD_NATIVE=0 (or a missing addon) → JS path.
    const nativeProcessed = nativeProcessSettings(settings);
    const processedSettings: Settings = nativeProcessed ?? postLoadSetupJS(settings);

    // The async syntax-highlight step (fetch/fs + @code-hike getThemeColors,
    // with a globalThis.__xydUserPreferences side effect) STAYS JS in BOTH
    // modes — it is not part of the serializable data plane.
    const syntaxHighlight = processedSettings?.theme?.coder?.syntaxHighlight;
    if (syntaxHighlight && typeof syntaxHighlight === "string") {
        handleSyntaxHighlight(syntaxHighlight, processedSettings);
    }

    return processedSettings;
}

// Native `process_settings` (replaceEnvVars + presetsSyncData) over a JSON
// boundary. `process.env` is snapshotted so Rust reads exactly what the JS
// `replaceEnvVars` would (it reads `process.env[VAR]` directly). Returns null
// when the native core is unavailable / disabled, so the caller falls back.
function nativeProcessSettings(settings: Settings): Settings | null {
    if (!settingsNative?.processSettings) {
        return null;
    }
    const env: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
        if (typeof value === "string") {
            env[key] = value;
        }
    }
    return JSON.parse(
        settingsNative.processSettings(JSON.stringify(settings), JSON.stringify(env))
    ) as Settings;
}

/**
 * The JS-owned data-plane oracle: `replaceEnvVars` + the SYNC presets, WITHOUT
 * the async syntax-highlight side effect. This is what the Rust
 * `process_settings` mirrors byte-for-byte; it is also the parity oracle for
 * the cargo + both-mode tests. Deterministic given `process.env`.
 */
export function postLoadSetupJS(settings: Settings): Settings {
    const processedSettings = replaceEnvVars(settings);
    presetsSyncData(processedSettings);
    return processedSettings;
}

/** The deterministic sync mutations of `presets()` (everything except the
 * async syntax-highlight trigger). Kept separate so the native path and the
 * oracle can share the exact same normalization. */
export function presetsSyncData(settings: Settings) {
    ensureNavigation(settings);

    if (settings?.theme && !settings?.theme?.head?.length) {
        settings.theme.head = [];
    }

    ensureBasename(settings);

    if (typeof settings?.integrations?.diagrams === "boolean" && settings?.integrations?.diagrams) {
        // by default, enable mermaid only
        settings.integrations.diagrams = [
            "mermaid",
        ]
    }
}

/**
 * Prefix a ROOT-ABSOLUTE asset path with the basename.
 *
 * Everything else passes through untouched: an icon-set name ("package"), an
 * iconify id ("docs:github"), an absolute URL and a data URI are all valid
 * icon values and none of them is a path this site serves. The
 * leading-slash test mirrors `isImageSource` in @xyd-js/components/writer,
 * narrowed to the absolute case — a relative "./logo.svg" has no basename to
 * anchor to.
 */
function basenameAsset(basename: string, value: unknown): any {
    if (typeof value !== "string" || !value.startsWith("/")) {
        return value;
    }
    return path.join(basename, value);
}

/**
 * Prefix every `icon` under `navigation` that is a root-absolute asset path.
 *
 * Walked generically rather than per-shape because `icon` appears on
 * NavigationItem, AnchorHeader and Sidebar, and NavigationItem nests through
 * both `pages` (sidebar-dropdown groups) and `dropdownMenu.items`. Enumerating
 * those would silently miss the next place an icon is added.
 */
function basenameNavigationIcons(node: any, basename: string) {
    if (!node || typeof node !== "object") {
        return;
    }
    if (Array.isArray(node)) {
        for (const item of node) {
            basenameNavigationIcons(item, basename);
        }
        return;
    }
    if ("icon" in node) {
        node.icon = basenameAsset(basename, node.icon);
    }
    for (const value of Object.values(node)) {
        if (value && typeof value === "object") {
            basenameNavigationIcons(value, basename);
        }
    }
}

function ensureBasename(settings: Settings) {
    const basename = settings?.advanced?.basename;
    if (!basename) {
        return;
    }
    // Navigation icons were previously left alone, so a docs.json mounted at a
    // basename had no way to express one: "/tech/astro.svg" resolves at the
    // server root, which the docs do not own. It happened to work in a static
    // production build only because buildStatic copies `public/` to BOTH the
    // client root and the basename — under `xyd dev` the root copy does not
    // exist and every such icon 404s.
    //
    // Done before the theme reads below so it is independent of them.
    basenameNavigationIcons(settings?.navigation, basename);

    if (typeof settings?.theme?.logo === "string") {
        settings.theme.logo = path.join(basename, settings?.theme?.logo);
    }
    if (
        typeof settings?.theme?.logo === "object" &&
        ("light" in settings?.theme?.logo ||
            "dark" in settings?.theme?.logo ||
            "href" in settings?.theme?.logo)
    ) {
        // Rebuilding from a field list drops anything not named here, which is
        // why a configured `alt` never reached the component on a site mounted
        // at a basename. `page` is dropped the same way and is NOT restored
        // here: it changes where the logo links, so it is a behaviour change
        // rather than a passthrough fix and wants its own change.
        settings.theme.logo = {
            light: path.join(basename, settings?.theme?.logo?.light || ""),
            dark: path.join(basename, settings?.theme?.logo?.dark || ""),
            alt: settings?.theme?.logo?.alt,
            href: settings?.theme?.logo?.href,
        };
    }
    if (typeof settings?.theme?.favicon === "string") {
        settings.theme.favicon = path.join(basename, settings?.theme?.favicon);
    }
}

async function handleSyntaxHighlight(
    syntaxHighlight: string,
    settings: Settings
) {
    try {
        // Ensure theme.coder exists
        if (!settings.theme) {
            settings.theme = { name: "default" } as any;
        }
        if (!settings.theme!.coder) {
            settings.theme!.coder = {};
        }

        // Check if it's a URL
        if (isUrl(syntaxHighlight)) {
            // Fetch from remote URL
            const response = await fetch(syntaxHighlight);
            if (!response.ok) {
                console.error(
                    `⚠️ Failed to fetch syntax highlight from URL: ${syntaxHighlight}`
                );
                return;
            }
            const json = await response.json();
            settings.theme!.coder!.syntaxHighlight = json;
        } else {
            // Handle local path - but first check if ita's actually a path
            const localPath = path.resolve(process.cwd(), syntaxHighlight);
            try {
                // Check if the file exists before trying to read it
                await fs.access(localPath);
                const fileContent = await fs.readFile(localPath, "utf-8");
                const json = JSON.parse(fileContent);
                settings.theme!.coder!.syntaxHighlight = json;
            } catch (error) {}
        }

        const syntaxHighlightTheme = settings.theme?.coder?.syntaxHighlight;
        if (syntaxHighlightTheme) {
            try {
                const themeColors = await getThemeColors(syntaxHighlightTheme);

                if (themeColors) {
                    globalThis.__xydUserPreferences = {
                        themeColors,
                    };
                }
            } catch (error) {
                console.error(
                    `⚠️ Error processing syntax highlight theme colors.`,
                    error
                );
            }
        }
    } catch (error) {
        console.error(
            `⚠️ Error processing syntax highlight: ${syntaxHighlight}`,
            error
        );
    }
}

/**
 * Loads environment variables from .env files
 * @param dirPath - The directory path to search for .env files
 */
async function loadEnvFiles(dirPath: string) {
    try {
        // Define the order of .env files to load (later files override earlier ones)
        const envFiles = [
            ".env",
            ".env.local",
            ".env.development",
            ".env.production",
        ];

        for (const envFile of envFiles) {
            const envPath = path.join(dirPath, envFile);

            try {
                await fs.access(envPath);
                const result = dotenvConfig({
                    path: envPath,
                    override: true, // Ensure variables are overridden
                });

                if (result.parsed && Object.keys(result.parsed).length > 0) {
                    console.debug(`📄 Loaded environment variables.`);
                }
            } catch (error) {
                // File doesn't exist, which is fine - continue to next file
            }
        }
    } catch (error) {
        console.warn("⚠️ Error loading .env files:", error);
    }
}


function isUrl(str: string): boolean {
    try {
        new URL(str);
        return true;
    } catch {
        return false;
    }
}

function ensureNavigation(json: Settings) {
    if (!json?.webeditor) {
        json.webeditor = {};
    }

    if (!json?.navigation) {
        json.navigation = {
            sidebar: [],
        };
    }

    if (!json?.navigation?.sidebar) {
        json.navigation.sidebar = [];
    }
}

type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object
        ? T[P] extends Function
            ? T[P]
            : T[P] extends Array<infer U>
                ? Array<DeepPartial<U>>
                : DeepPartial<T[P]>
        : T[P];
};

function deepMerge<T>(target: T, source: DeepPartial<T>): T {
    for (const key in source) {
        const sourceVal = source[key];
        const targetVal = target[key];

        if (
            sourceVal &&
            typeof sourceVal === "object" &&
            !Array.isArray(sourceVal) &&
            typeof targetVal === "object" &&
            targetVal !== null
        ) {
            target[key] = deepMerge(targetVal, sourceVal);
        } else if (sourceVal !== undefined) {
            target[key] = sourceVal as any;
        }
    }

    return target;
}

async function isOpenApiYaml(filePath: string): Promise<boolean> {
    try {
        const content = await fs.readFile(filePath, "utf-8");
        const parsed = yaml.load(content);
        if (!parsed) {
            return false;
        }

        return parsed && typeof parsed === "object" && "openapi" in parsed;
    } catch (error) {
        console.warn(`⚠️ Error reading or parsing YAML file ${filePath}:`, error);
        return false;
    }
}
