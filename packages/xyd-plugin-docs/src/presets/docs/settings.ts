import fs from 'fs/promises';
import path from 'node:path';
import { URL } from 'node:url';

import { createServer } from 'vite';

import { Settings } from "@xyd-js/core";
import { getThemeColors } from '@code-hike/lighter';

const extensions = ['tsx', 'ts', 'json'];

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
 * @returns A Promise that resolves to:
 *   - The Settings object if a valid settings file was found and loaded
 *   - A string if the settings file contains a string value
 *   - null if no settings file was found or an error occurred
 * 
 * @throws May throw errors if file reading or parsing fails
 */
export async function readSettings() {
    const dirPath = process.cwd();
    const baseFileName = 'docs';

    let settingsFilePath = '';
    let reactSettings = false;

    try {
        const files = await fs.readdir(dirPath);
        const settingsFile = files.find(file => {
            const ext = path.extname(file).slice(1);
            return file.startsWith(baseFileName) && extensions.includes(ext);
        });

        if (settingsFile) {
            settingsFilePath = path.join(dirPath, settingsFile);
            reactSettings = path.extname(settingsFile) !== '.json';
        } else {
            console.error(`No settings file found.\nFile must be named 'docs' with one of the following extensions: ${extensions.join(', ')}`);
            return null;
        }
    } catch (error) {
        console.error(error);
        return null;
    }

    if (reactSettings) {
        const settingsPreview = await createServer({
            optimizeDeps: {
                include: ["react/jsx-runtime"],
            },
        });
        const config = await settingsPreview.ssrLoadModule(settingsFilePath);
        const mod = config.default as Settings;

        presets(mod)

        return mod
    } else {
        const rawJsonSettings = await fs.readFile(settingsFilePath, 'utf-8');
        try {
            let json = JSON.parse(rawJsonSettings) as Settings

            presets(json)

            return json
        } catch (e) {
            console.error("⚠️ Error parsing settings file")

            return null
        }
    }
}

// if (settings?.theme?.coder?.syntaxHighlight) {

// }

function presets(settings: Settings) {
    if (settings?.theme?.coder?.syntaxHighlight && typeof settings.theme.coder.syntaxHighlight === 'string') {
        handleSyntaxHighlight(settings.theme.coder.syntaxHighlight, settings);
    }
    ensureNavigation(settings)

    if (settings?.theme && !settings?.theme?.head?.length) {
        settings.theme.head = []
    }
}

async function handleSyntaxHighlight(syntaxHighlight: string, settings: Settings) {
    try {
        // Ensure theme.coder exists
        if (!settings.theme) {
            settings.theme = { name: 'default' } as any;
        }
        if (!settings.theme!.coder) {
            settings.theme!.coder = {};
        }

        // Check if it's a URL
        if (isUrl(syntaxHighlight)) {
            // Fetch from remote URL
            const response = await fetch(syntaxHighlight);
            if (!response.ok) {
                console.error(`⚠️ Failed to fetch syntax highlight from URL: ${syntaxHighlight}`);
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
                const fileContent = await fs.readFile(localPath, 'utf-8');
                const json = JSON.parse(fileContent);
                settings.theme!.coder!.syntaxHighlight = json;
            } catch (error) {
            }
        }

        const syntaxHighlightTheme = settings.theme?.coder?.syntaxHighlight 
        if (syntaxHighlightTheme) {
            try {
                const themeColors = await getThemeColors(syntaxHighlightTheme);

                if (themeColors) {
                    globalThis.__xydUserPreferences = {
                        themeColors
                    }
                }
            } catch (error) {
                console.error(`⚠️ Error processing syntax highlight theme colors.`, error);
            }
        }
    } catch (error) {
        console.error(`⚠️ Error processing syntax highlight: ${syntaxHighlight}`, error);
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
        json.webeditor = {}
    }

    if (!json?.navigation) {
        json.navigation = {
            sidebar: []
        }
    }

    if (!json?.navigation?.sidebar) {
        json.navigation.sidebar = []
    }
}