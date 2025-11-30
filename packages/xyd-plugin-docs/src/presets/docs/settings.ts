import fs from "fs/promises";
import path from "node:path";
import { URL } from "node:url";

import { createServer } from "vite";
import { config as dotenvConfig } from "dotenv";
import yaml from "js-yaml";

import { getThemeColors } from "@code-hike/lighter";

import { Settings } from "@xyd-js/core";
import { replaceEnvVars } from "@xyd-js/cli-sdk";

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
            const settingsPreview = await createServer({
                optimizeDeps: {
                    include: ["react/jsx-runtime"],
                },
            });
            const config = await settingsPreview.ssrLoadModule(settingsFilePath);
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
    // Replace environment variables in the settings
    const processedSettings = replaceEnvVars(settings);
    presets(processedSettings);

    return processedSettings;
}

// if (settings?.theme?.coder?.syntaxHighlight) {

// }

function presets(settings: Settings) {
    if (
        settings?.theme?.coder?.syntaxHighlight &&
        typeof settings.theme.coder.syntaxHighlight === "string"
    ) {
        handleSyntaxHighlight(settings.theme.coder.syntaxHighlight, settings);
    }
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

function ensureBasename(settings: Settings) {
    const basename = settings?.advanced?.basename;
    if (!basename) {
        return;
    }
    if (typeof settings?.theme?.logo === "string") {
        settings.theme.logo = path.join(basename, settings?.theme?.logo);
    }
    if (
        typeof settings?.theme?.logo === "object" &&
        ("light" in settings?.theme?.logo ||
            "dark" in settings?.theme?.logo ||
            "href" in settings?.theme?.logo)
    ) {
        settings.theme.logo = {
            light: path.join(basename, settings?.theme?.logo?.light || ""),
            dark: path.join(basename, settings?.theme?.logo?.dark || ""),
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
