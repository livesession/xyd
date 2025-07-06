import { readdir } from 'node:fs/promises'

export type DocsFrameworkName = "mintlify" | "nextra" | "docusaurus" | "vitepress"

import { mintlifyMigrator, isMintlify } from "./mintlify";
import { nextraMigrator, isNextra } from "./nextra";
import { docusaurusMigrator, isDocusaurus } from "./docusaururs";
import { vitepressMigrator, isVitepress } from "./vitepress";

export async function migration(docsPath: string) {
    console.log('Detecting framework in repository...')

    try {
        // Read root directory files (non-recursive)
        const files = await readdir(docsPath, { withFileTypes: true })

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
): Promise<DocsFrameworkName | null> {
    if (await isMintlify(docsPath, fileName)) {
        return "mintlify"
    }
    if (await isNextra(docsPath, fileName)) {
        return "nextra"
    }
    if (await isDocusaurus(docsPath, fileName)) {
        return "docusaurus"
    }
    if (await isVitepress(docsPath, fileName)) {
        return "vitepress"
    }

    return null
}

async function frameworkMigration(framework: DocsFrameworkName, docsPath: string) {
    switch (framework) {
        case "mintlify":
            return await mintlifyMigrator(docsPath)
        case "nextra":
            return await nextraMigrator(docsPath)
        case "docusaurus":
            return await docusaurusMigrator(docsPath)
        case "vitepress":
            return await vitepressMigrator(docsPath)
    }
}
