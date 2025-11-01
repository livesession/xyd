import { Settings } from "@xyd-js/core";

export * from "./meta"

// TODO: in the future fix package resolution instead of globalThis

declare global {
    var __xydCtxSettings: Settings | null
    var __xydCtxBasePath: string | null
}

if (typeof globalThis.__xydCtxSettings === 'undefined') {
    globalThis.__xydCtxSettings = null
}

if (typeof globalThis.__xydCtxBasePath === 'undefined') {
    globalThis.__xydCtxBasePath = null
}

export function contextSettings(): Settings {
    if (!globalThis.__xydCtxSettings) {
        throw new Error("Context settings not found")
    }

    return globalThis.__xydCtxSettings
}

export function setContextSettings(s: Settings) {
    globalThis.__xydCtxSettings = s
}

export function contextBasePath(): string {
    if (!globalThis.__xydCtxBasePath) {
        throw new Error("Context base path not found")
    }

    return globalThis.__xydCtxBasePath
}

export function setContextBasePath(p: string) {
    globalThis.__xydCtxBasePath = p
}