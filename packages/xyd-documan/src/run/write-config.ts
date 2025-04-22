import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { Settings } from "@xyd-js/core";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Writes the configuration to the shared-data.ts file
 * @param settings The settings to write
 * @param basePath The base path to use
 */
export async function writeConfig(settings: Settings, basePath: string) {
    // Determine the path to the shared-data.ts file based on the environment
    const hostDir = process.env.XYD_CLI
        ? __dirname
        : process.env.XYD_DOCUMAN_HOST || path.join(__dirname, "../host");

    const sharedDataPath = path.join(hostDir, "app", "shared-data.ts");

    // Create the content for the shared-data.ts file
    const content = `// This file is auto-generated. Do not edit manually.
import {Settings} from "@xyd-js/core";

export const settings: Settings = ${JSON.stringify(settings, null, 2)};
export const basePath: string = "${basePath}";
`;

    // Ensure the directory exists
    const dir = path.dirname(sharedDataPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Write the file
    fs.writeFileSync(sharedDataPath, content);
} 