export function vitepressMigrator(docsPath: string) {
    console.log('Migrating VitePress repository...')
}

export async function isVitepress(docsPath: string, fileName: string) {
    if (fileName === 'docs/.vitepress/config.js' || fileName === 'docs/.vitepress/config.ts') {
        console.log('🔍 VitePress framework detected!')
        return true
    }
}