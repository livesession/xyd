import { Settings } from "@xyd-js/core";

export * from "./meta"

let settings: Settings | null = null
let basePath: string | null = null

export function contextSettings(): Settings {
    if (!settings) {
        throw new Error("Context settings not found")
    }

    return settings
}

export function setContextSettings(s: Settings) {
    settings = s
}

export function contextBasePath(): string {
    if (!basePath) {
        throw new Error("Context base path not found")
    }

    return basePath
}

export function setContextBasePath(p: string) {
    basePath = p
}