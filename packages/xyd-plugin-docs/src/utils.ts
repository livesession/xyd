import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const HOST_FOLDER_PATH = ".xyd/host"

// TODO: share with documan
export function getHostPath() {
    if (process.env.XYD_DEV_MODE) {
        return path.join(__dirname, "../../../", HOST_FOLDER_PATH)
    }
    return path.join(process.cwd(), HOST_FOLDER_PATH)
}

export function getDocsPluginBasePath() {
    return path.join(getHostPath(), "./plugins/xyd-plugin-docs")
}