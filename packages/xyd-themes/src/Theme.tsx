import * as React from "react"
import { useMetadata } from "@xyd-js/framework/react"
import { Surfaces } from "@xyd-js/framework"
import type { Appearance, JSONComponent, Theme as ThemeSettings, WebEditor, WebEditorNavigationItem } from "@xyd-js/core"
import { ReactContent } from "@xyd-js/components/content"

// ─── Theme Class ──────────────────────────────────────────────

export abstract class Theme {
    constructor() {
        this.settings = globalThis.__xydThemeSettings

        this.useHideToc = this.useHideToc.bind(this)
        this.appearanceWebEditor = this.appearanceWebEditor.bind(this)
        this.headerPrepend = this.headerPrepend.bind(this)
        this.mergeUserAppearance = this.mergeUserAppearance.bind(this)

        {
            if (globalThis.__xydThemeSettings.Update) {
                console.error("Theme API `Update` is already defined")
            }
            globalThis.__xydThemeSettings.Update = this.update.bind(this) // TODO: in the future better solution cuz we modify original object

        }
        {
            if (globalThis.__xydThemeSettings.UpdatePreset) {
                console.error("Theme API `UpdatePreset` is already defined")
            }
            globalThis.__xydThemeSettings.UpdatePreset = this.updateThemePreset.bind(this)
        }

        this.theme = globalThis.__xydThemeSettings
        this.surfaces = globalThis.__xydSurfaces
        this.reactContent = globalThis.__xydReactContent
        this.webeditor = globalThis.__xydWebeditor as WebEditor
        this.userAppearance = JSON.parse(JSON.stringify(this.theme.appearance || {}))
        this.originalWebeditor = Object.freeze(JSON.parse(JSON.stringify(this.webeditor)))

        this.appearanceWebEditor()
    }

    private webeditor: WebEditor
    private originalWebeditor: WebEditor
    private userAppearance: Appearance
    protected settings: ThemeSettings
    protected theme: CustomTheme<ThemeSettings>
    protected readonly reactContent: ReactContent
    protected readonly surfaces: Surfaces

    public abstract Page({ children }: { children: React.ReactNode }): React.ReactElement

    public abstract Layout({ children }: { children: React.ReactNode }): React.ReactElement

    public abstract reactContentComponents(): { [component: string]: (props: any) => React.JSX.Element | null }

    protected useHideToc() {
        const meta = useMetadata()
        return meta?.layout === "wide" || meta?.layout === "center"
    }

    private headerPrepend(searchItem: any, float: string) {
        const header = this.webeditor.header || []
        const insertIndex = header.findIndex(item => item.float === float)
        return insertIndex === -1
            ? [...header, searchItem]
            : [...header.slice(0, insertIndex), searchItem, ...header.slice(insertIndex)]
    }

    private update(patch: DeepPartial<ThemeSettings>, updateWebeditor: boolean = true) {
        deepMerge(this.theme, patch)
        if (updateWebeditor) {
            this.appearanceWebEditor()
        }
    }

    private updateThemePreset(patch: string[]) {
        this.update({
            appearance: {
                presets: [
                    ...(this.settings.appearance?.presets || []),
                    ...(patch || [])
                ]
            }
        })
    }

    private appearanceWebEditor() {
        if (!this.theme.appearance) {
            return
        }

        deepMergeWithCopy(this.webeditor, this.originalWebeditor)

        const searchAppearance = this.theme.appearance?.search?.sidebar || this.theme.appearance?.search?.middle
        if (searchAppearance) {
            const hasSearch = this.webeditor.header?.find(item => item.component === "Search")

            if (hasSearch) {
                console.warn("Search already exists in webeditor.header")
                return
            }

            if (this.theme.appearance?.search?.sidebar) {
                const search: WebEditorNavigationItem = {
                    component: "Search",
                    mobile: this.theme.appearance?.search?.sidebar === "mobile" || undefined,
                    desktop: this.theme.appearance?.search?.sidebar === "desktop" || undefined
                }
                if (!this.webeditor.sidebarTop) {
                    this.webeditor.sidebarTop = []
                }

                this.webeditor.sidebarTop?.unshift({
                    ...search,
                })
            }

            if (this.theme.appearance?.search?.middle) {
                const search: WebEditorNavigationItem = {
                    component: "Search",
                    mobile: this.theme.appearance?.search?.middle === "mobile" || undefined,
                    desktop: this.theme.appearance?.search?.middle === "desktop" || undefined
                }
                const searchItem = {
                    ...search,
                    float: "center" as const
                }

                this.webeditor.header = this.headerPrepend(searchItem, "center")
            }
        }

        if (
            this.theme.appearance?.sidebar?.scrollbarColor &&
            !this.theme.appearance?.sidebar?.scrollbar
        ) {
            this.theme.appearance.sidebar.scrollbar = "secondary"
        }
    }

    private mergeUserAppearance() {
        this.update({
            appearance: this.userAppearance
        }, false)
    }
}

// ─── DeepPartial Type ─────────────────────────────────────────

type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object
    ? T[P] extends Function
    ? T[P]
    : T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : DeepPartial<T[P]>
    : T[P]
}

// ─── CustomTheme Type ─────────────────────────────────────────

type CustomTheme<T> = T & {
    Update: (value: DeepPartial<T>) => void
    UpdatePreset: (value: string[]) => void
}

// ─── Deep Merge Helper ────────────────────────────────────────

function deepMerge<T>(target: T, source: DeepPartial<T>): T {
    for (const key in source) {
        const sourceVal = source[key]
        const targetVal = target[key]

        if (
            sourceVal &&
            typeof sourceVal === "object" &&
            !Array.isArray(sourceVal) &&
            typeof targetVal === "object" &&
            targetVal !== null
        ) {
            target[key] = deepMerge(targetVal, sourceVal)
        } else if (sourceVal !== undefined) {
            target[key] = sourceVal as any
        }
    }

    return target
}

// ─── Deep Merge With Copy Helper ─────────────────────────────

function deepMergeWithCopy<T>(
    target: T,
    source: DeepPartial<T>
): T {
    // First perform the deep merge
    deepMerge(target, source)

    // Then do JSON.parse(JSON.stringify()) on all target properties
    for (const key in target) {
        if (target[key] !== undefined) {
            (target as any)[key] = JSON.parse(JSON.stringify(target[key]))
        }
    }

    return target
}
