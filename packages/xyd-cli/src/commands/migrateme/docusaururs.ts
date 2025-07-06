
export function docusaurusMigrator(docsPath: string) {
    console.log('Migrating Docusaurus repository...')
}


export async function isDocusaurus(docsPath: string, fileName: string) {
    if (fileName === 'docusaurus.config.js' || fileName === 'docusaurus.config.ts') {
        console.log('🔍 Docusaurus framework detected!')
        return true
    }
}