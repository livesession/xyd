// Client-safe: no imports from @xyd-js/content or other server-only modules.
// Lives in hydration/ for export but can be loaded into the browser bundle.

import type { Settings } from "@xyd-js/core";

// resolveLocaleSettings swaps in the matching language entry's navigation
// fields and deep-merges its overrides on top of the result. Used both
// server-side (in mapSettingsToProps) and client-side (in the Layout
// component) so `useSettings()` returns the locale-effective settings.
//
// If `entry.overrides` is set, `applyOverrides()` deep-merges it. Both
// nested objects (Partial<Settings>) and flat dot-keys
// (`{"components.foo.bar": "x"}`) are accepted; dot-keys are expanded to
// nested form before the merge.
export function resolveLocaleSettings(settings: Settings, locale?: string): Settings {
    const langs = settings?.navigation?.languages
    if (!locale || !langs?.length) return settings
    const entry = langs.find(l => l.language === locale)
    if (!entry) return settings

    const next: Settings = {
        ...settings,
        navigation: {
            ...settings.navigation,
            sidebar: entry.sidebar,
            tabs: entry.tabs,
            sidebarDropdown: entry.sidebarDropdown,
            segments: entry.segments,
            anchors: entry.anchors,
        }
    }

    if (entry.overrides) {
        return applyOverrides(next, entry.overrides)
    }
    return next
}

// applyOverrides deep-merges `overrides` into `base` and returns a new
// object. Supports both nested-object overrides (`Partial<Settings>`) and
// flat dot-keys (`{"components.foo.bar": "x"}`). Dot-keys are expanded to
// nested form before the merge.
export function applyOverrides<T>(base: T, overrides: any): T {
    if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) {
        return base
    }
    return mergeDeep(base, expandDotKeys(overrides))
}

// Expand any flat dot-key entries (e.g. `"a.b.c": 1`) inside `input` into
// nested form. Plain nested objects pass through after recursion. Arrays
// and primitives are returned as-is.
export function expandDotKeys(input: any): any {
    if (!input || typeof input !== "object" || Array.isArray(input)) return input
    const out: any = {}
    for (const key of Object.keys(input)) {
        const value = expandDotKeys(input[key])
        if (key.includes(".")) {
            const segments = key.split(".")
            let cursor = out
            for (let i = 0; i < segments.length - 1; i++) {
                const seg = segments[i]
                if (!cursor[seg] || typeof cursor[seg] !== "object" || Array.isArray(cursor[seg])) {
                    cursor[seg] = {}
                }
                cursor = cursor[seg]
            }
            const last = segments[segments.length - 1]
            cursor[last] = mergeDeep(cursor[last], value)
        } else {
            out[key] = mergeDeep(out[key], value)
        }
    }
    return out
}

function mergeDeep(target: any, source: any): any {
    if (source === undefined) return target
    if (target === undefined) return cloneJSON(source)
    if (
        target === null || typeof target !== "object" || Array.isArray(target) ||
        source === null || typeof source !== "object" || Array.isArray(source)
    ) {
        return cloneJSON(source)
    }
    const out: any = { ...target }
    for (const k of Object.keys(source)) {
        out[k] = mergeDeep(out[k], source[k])
    }
    return out
}

function cloneJSON<T>(v: T): T {
    if (v === undefined || v === null || typeof v !== "object") return v
    return JSON.parse(JSON.stringify(v))
}
