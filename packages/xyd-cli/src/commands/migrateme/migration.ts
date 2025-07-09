import {readdir} from 'node:fs/promises'


import {mintlifyMigrator, isMintlify} from "./mintlify";
import {nextraMigrator, isNextra} from "./nextra/nextra";
import {docusaurusMigrator, isDocusaurus} from "./docusaururs/docusaururs";
import {vitepressMigrator, isVitepress} from "./vitepress/vitepress";
import {DocsFramework} from "./types";

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

async function frameworkMigration(framework: DocsFramework, docsPath: string) {
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
