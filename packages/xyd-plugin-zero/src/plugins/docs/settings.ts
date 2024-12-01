import fs from 'fs/promises';
import path from 'node:path';

import {createServer} from 'vite';

import {Settings} from "@xyd/core";

const extensions = ['tsx', 'jsx', 'js', 'ts', 'json'];

// readSettings load's xyd settings from the current working directory
// settings can be a React or json file
export async function readSettings(): Promise<Settings | string | null> {
    const dirPath = process.cwd();
    const baseFileName = 'settings';
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
            console.error('No settings file found');
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
        return JSON.parse(rawJsonSettings);
    }
}