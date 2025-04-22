import path from "node:path";

import {
    route,
} from "@react-router/dev/routes";

// Declare the global property type
declare global {
    var __xydBasePath: string;
}

const basePath = globalThis.__xydBasePath

export const routes = [
    route("*", path.join(basePath, "src/pages/docs.tsx")),
]

export default routes