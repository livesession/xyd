export function vitepressMigrator(docsPath: string) {
    throw new Error('VitePress migration is not implemented yet')
    console.log('Migrating VitePress repository...')
}

export async function isVitepress(docsPath: string, fileName: string) {
    return false
    if (fileName === 'docs/.vitepress/config.js' || fileName === 'docs/.vitepress/config.ts') {
        console.log('🔍 VitePress framework detected!')
        return true
    }
}