import path from "node:path";
import fs from "node:fs/promises";

import type {Config} from "@react-router/dev/config";

import {Settings} from "@xyd-js/core";
import {docPaths} from "./app/docPaths";

declare global {
    var __xydSettings: Settings;
    var __xydStaticFiles: string[];
}

// Function to get all static files from the public directory
async function getStaticFiles() {
    const publicDir = path.join(process.cwd(), "public");
    const paths: string[] = [];

    try {
        await fs.access(publicDir);
    } catch (e) {
        return paths;
    }

    async function scanDirectory(dir: string, basePath: string = "") {
        const entries = await fs.readdir(dir, {withFileTypes: true});

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.join(basePath, entry.name);

            if (entry.isDirectory()) {
                await scanDirectory(fullPath, relativePath);
            } else {
                paths.push(`/public/${relativePath}`);
            }
        }
    }

    await scanDirectory(publicDir);
    return paths;
}

// Function to find documentation files for navigation paths
// async function findDocFiles(navigationPaths: string[]) {
//     const docFiles: string[] = [];
//
//     for (const navPath of navigationPaths) {
//         // Try .mdx first, then .md
//         const mdxPath = path.join(process.cwd(), navPath + '.mdx');
//         const mdPath = path.join(process.cwd(), navPath + '.md');
//
//         try {
//             await fs.access(mdxPath);
//             docFiles.push(navPath + ".mdx");
//         } catch {
//             try {
//                 await fs.access(mdPath);
//                 docFiles.push(navPath + ".md");
//             } catch {
//             }
//         }
//     }
//
//     return docFiles;
// }

// Use settings.navigation if it exists, otherwise use an empty object
const navigation = __xydSettings?.navigation || {sidebar: []};
const navigationPaths = docPaths(navigation);

// Get static files and documentation files
const staticFiles = await getStaticFiles();
// const docFiles = await findDocFiles(navigationPaths);

globalThis.__xydStaticFiles = staticFiles

// Combine all paths for prerendering
const prerenderPaths = [
    ...navigationPaths,
    ...staticFiles,

    "/sitemap.xml",
    "/robots.txt",
    // ...docFiles,
];
const cwd = process.cwd();

export default {
    ssr: false,
    prerender: prerenderPaths,
    buildDirectory: path.join(cwd, ".xyd/build"),
    // return a list of URLs to prerender at build time
} satisfies Config;