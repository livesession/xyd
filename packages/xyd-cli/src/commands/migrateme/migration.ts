import {readdir} from 'node:fs/promises'
import {existsSync} from 'node:fs'
import {promisify} from "node:util";
import {exec} from "node:child_process";

import {mintlifyMigrator, isMintlify} from "./mintlify";
import {nextraMigrator, isNextra} from "./nextra";
import {docusaurusMigrator, isDocusaurus} from "./docusaururs";
import {vitepressMigrator, isVitepress} from "./vitepress";
import {DocsFramework} from "./types";

const execAsync = promisify(exec)

export async function migration(docsPath: string) {
    console.log('Detecting framework in repository...')

    try {
        // Read root directory files (non-recursive)
        const files = await readdir(docsPath, {withFileTypes: true})

        // Seek strategy: look for framework-specific files
        for (const file of files) {
            if (!file.isFile()) {
                continue
            }

            const fileNameLower = file.name.toLowerCase()

            const framework = await detectFrameworkByFile(fileNameLower, docsPath)
            if (framework) {
                await frameworkMigration(framework, docsPath)

                return
            }
        }

        console.log('❌ No supported documentation framework detected in root directory')
        console.log('📋 Supported frameworks: Mintlify, Nextra, Docusaurus, VuePress')

    } catch (error) {
        console.error('Error detecting framework:', error)
    }
}

async function detectFrameworkByFile(
    fileName: string,
    docsPath: string
): Promise<DocsFramework | null> {
    if (await isMintlify(docsPath, fileName)) {
        return DocsFramework.MINTLIFY
    }
    if (await isNextra(docsPath, fileName)) {
        return DocsFramework.NEXTRA
    }
    if (await isDocusaurus(docsPath, fileName)) {
        return DocsFramework.DOCUSAURUS
    }
    if (await isVitepress(docsPath, fileName)) {
        return DocsFramework.VITEPRESS
    }

    return null
}

async function frameworkMigration(
    framework: DocsFramework,
    docsPath: string,
    outDir: string | boolean = false
) {
    // 1. if copy is true, clone the docsPath directory
    if (outDir) {
        docsPath = await cloneDocsPath(docsPath, outDir)
    }

    switch (framework) {
        case DocsFramework.MINTLIFY:
            return await mintlifyMigrator(docsPath)
        case DocsFramework.NEXTRA:
            return await nextraMigrator(docsPath)
        case DocsFramework.DOCUSAURUS:
            return await docusaurusMigrator(docsPath)
        case DocsFramework.VITEPRESS:
            return await vitepressMigrator(docsPath)
    }
}

export async function cloneDocsPath(
    docsPath: string,
    outDir: string | boolean = true
) {
    if (typeof outDir === "boolean") {
        outDir = `${docsPath}_${Math.random().toString(36).substring(2, 8)}`;
    }

    docsPath = await cloneDirectory(docsPath, outDir);
    console.log(`Cloned docsPath to: ${docsPath}`);

    return docsPath
}

async function cloneDirectory(src: string, dest = ""): Promise<string> {
    if (existsSync(dest)) {
        await execAsync(`rm -rf "${dest}"`);
    }
    await execAsync(`cp -R "${src}" "${dest}"`);
    return dest;
}
