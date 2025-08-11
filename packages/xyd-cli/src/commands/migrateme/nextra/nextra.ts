export function nextraMigrator(docsPath: string) {
    throw new Error('Nextra migration is not implemented yet')  
    console.log('Migrating Nextra repository...')
}


export async function isNextra(docsPath: string, fileName: string) {
    return false
    // Add more framework detection here
    // Example: Nextra detection
    if (fileName === 'nextra.config.js' || fileName === 'nextra.config.ts') {
        console.log('🔍 Nextra framework detected!')
        return true
    }
}