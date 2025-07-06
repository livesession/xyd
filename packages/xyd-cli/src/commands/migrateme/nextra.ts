export function nextraMigrator(docsPath: string) {
    console.log('Migrating Nextra repository...')
}


export async function isNextra(docsPath: string, fileName: string) {
    // Add more framework detection here
    // Example: Nextra detection
    if (fileName === 'nextra.config.js' || fileName === 'nextra.config.ts') {
        console.log('🔍 Nextra framework detected!')
        return true
    }
}