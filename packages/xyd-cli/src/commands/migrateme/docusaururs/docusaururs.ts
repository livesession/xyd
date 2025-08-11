
export function docusaurusMigrator(docsPath: string) {
    throw new Error('Docusaurus migration is not implemented yet')
    console.log('Migrating Docusaurus repository...')
}


export async function isDocusaurus(docsPath: string, fileName: string) {
    return false
    if (fileName === 'docusaurus.config.js' || fileName === 'docusaurus.config.ts') {
        console.log('🔍 Docusaurus framework detected!')
        return true
    }
}