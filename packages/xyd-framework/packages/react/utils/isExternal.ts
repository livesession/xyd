export function isExternal(filePath: string) {
    return filePath.startsWith('http://') || filePath.startsWith('https://');
}