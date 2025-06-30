import fs from 'fs/promises';
import path from 'node:path';

import { createServer } from 'vite';

import { Settings } from "@xyd-js/core";

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
        return config.default as Settings;
    } else {
        const rawJsonSettings = await fs.readFile(settingsFilePath, 'utf-8');
        try {
            let json = JSON.parse(rawJsonSettings) as Settings


            return json
        } catch (e) {
            console.error("⚠️ Error parsing settings file")

            return null
        }
    }
}