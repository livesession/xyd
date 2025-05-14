export const HOST_FOLDER_PATH = ".xyd/host"
export const CACHE_FOLDER_PATH = ".xyd/.cache"
export const BUILD_FOLDER_PATH = ".xyd/build"

export const SUPPORTED_SETTINGS_FILES = [
    'xyd.json',
    'xyd.yaml',
    'xyd.yml',
    'xyd.ts',
    'xyd.tsx'
]

export const SUPPORTED_WATCH_FILES = [
    '.md',
    '.mdx',
    ...SUPPORTED_SETTINGS_FILES
]