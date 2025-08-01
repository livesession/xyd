import * as React from "react"

import type { Appearance, Navigation, Theme as ThemeSettings, UserPreferences, WebEditor, WebEditorNavigationItem } from "@xyd-js/core"
import { ReactContent } from "@xyd-js/components/content"
import { IconSocial } from "@xyd-js/components/writer"
import { Surfaces } from "@xyd-js/framework"
import { useMetadata } from "@xyd-js/framework/react"

// ─── Theme Class ──────────────────────────────────────────────

// TODO: still issues with double settings on dev changing
// TODO: refactor
export abstract class Theme {
    constructor() {
        this.settings = globalThis.__xydThemeSettings

        this.useHideToc = this.useHideToc.bind(this)
        this.useHideSidebar = this.useHideSidebar.bind(this)
        this.appearanceWebEditor = this.appearanceWebEditor.bind(this)
        this.headerPrepend = this.headerPrepend.bind(this)
        this.mergeUserAppearance = this.mergeUserAppearance.bind(this)
        this.resetWebeditor = this.resetWebeditor.bind(this)

        globalThis.__xydThemeSettings.Update = this.update.bind(this) // TODO: in the future better solution cuz we modify original object
        globalThis.__xydThemeSettings.UpdatePreset = this.updateThemePreset.bind(this)

        this.theme = globalThis.__xydThemeSettings
        this.surfaces = globalThis.__xydSurfaces
        this.reactContent = globalThis.__xydReactContent
        this.navigation = globalThis.__xydNavigation as Navigation
        this.webeditor = globalThis.__xydWebeditor as WebEditor
        this.userPreferences = globalThis.__xydUserPreferences as UserPreferences

        this.userAppearance = JSON.parse(JSON.stringify(this.theme.appearance || {}))

        this.appearanceWebEditor()
    }

    private webeditor: WebEditor
    private navigation: Navigation

    private userAppearance: Appearance
    protected settings: ThemeSettings
    protected theme: CustomTheme<ThemeSettings>
    protected readonly reactContent: ReactContent
    protected readonly surfaces: Surfaces
    private readonly userPreferences: UserPreferences

    private get originalTheme(): ThemeSettings {
        return JSON.parse(JSON.stringify(globalThis.__xydSettingsClone?.theme))
    }

    private get originalWebeditor(): WebEditor {
        return JSON.parse(JSON.stringify(globalThis.__xydSettingsClone?.webeditor))
    }

    private get originalNavigation(): Navigation {
        return JSON.parse(JSON.stringify(globalThis.__xydSettingsClone?.navigation))
    }

    public abstract Page({ children }: { children: React.ReactNode }): React.ReactElement

    public abstract Layout({ children }: { children: React.ReactNode }): React.ReactElement

    public abstract reactContentComponents(): { [component: string]: (props: any) => React.JSX.Element | null }

    protected useHideToc() {
        const meta = useMetadata()
        return meta?.layout === "wide" || meta?.layout === "reader" || meta?.layout === "page"
    }

    protected useHideSidebar() {
        const meta = useMetadata()
        return meta?.layout === "page" || meta?.layout === "reader"
    }

    private headerPrepend(searchItem: any, float: string) {
        const header = this.webeditor.header || []
        const insertIndex = header.findIndex(item => item.float === float)
        return insertIndex === -1
            ? [...header, searchItem]
            : [...header.slice(0, insertIndex), searchItem, ...header.slice(insertIndex)]
    }

    private headerAppend(searchItem: any, float: string = "") {
        const header = this.webeditor.header || []
        const insertIndex = header.findIndex(item => item.float === float)
        return insertIndex === -1
            ? [...header, searchItem]
            : [...header.slice(0, insertIndex + 1), searchItem, ...header.slice(insertIndex + 1)]
    }

    private update(patch: DeepPartial<ThemeSettings>) {
        deepMerge(this.theme, patch)
        this.appearanceWebEditor()
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

        this.resetWebeditor()
        this.resetNavigation()

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

        if (this.theme.appearance?.logo?.sidebar) {
            const logo: WebEditorNavigationItem = {
                component: "Logo",
                mobile: this.theme.appearance?.logo?.sidebar === "mobile" || undefined,
                desktop: this.theme.appearance?.logo?.sidebar === "desktop" || undefined
            }
            if (!this.webeditor.sidebarTop) {
                this.webeditor.sidebarTop = []
            }

            // this.webeditor.sidebarTop = [
            //     logo,
            //     ...(this.originalWebeditor.sidebarTop || []),
            // ]

            this.webeditor.sidebarTop?.unshift(logo)
        }

        if (
            this.theme.appearance?.tabs?.surface === "center" &&
            this.navigation?.tabs?.length
        ) {
            this.insertCenterHeaderTabs()
        }

        if (
            this.navigation?.tabs?.length &&
            this.navigation?.segments?.length && // cuz segments defaults are inside subnav
            this.theme.appearance?.tabs?.surface !== "center") {

            this.navigation.segments = this.navigation.segments.map(segment => {
                if (segment.appearance !== "sidebarDropdown") {
                    segment.appearance = "sidebarDropdown"
                }
                return segment
            })
        }

        if (this.navigation?.anchors?.header?.length) {
            this.navigation?.anchors?.header.forEach(item => {
                const button = {
                    ...item,
                    component: "Button",
                    props: {},
                    float: "right" as const,
                    desktop: true,
                }

                if ("button" in item) {
                    this.webeditor.header = this.headerAppend({
                        ...button,
                        props: {
                            kind: item.button,
                            children: item.title,
                            size: this.theme.appearance?.header?.buttonSize || "md"
                        },
                    })

                    return
                }

                if ("social" in item) {
                    this.webeditor.header = this.headerAppend({
                        ...button,
                        icon: <IconSocial kind={item.social as any} />,
                        props: {
                            theme: "ghost",
                            icon: <IconSocial kind={item.social as any} />,
                        },
                    })

                    return
                }

                if (item.icon) {
                    this.webeditor.header = this.headerAppend({
                        ...button,
                        props: {
                            theme: "ghost",
                            icon: item.icon,
                        },
                    })

                    return
                }

                this.webeditor.header = this.headerAppend({
                    ...item,
                    float: "right" as const,
                    desktop: true,
                })
            })
        }

        // TODO: in the future it should be in theme level
        if (this.theme.name === "gusto") {
            if (this.navigation?.tabs?.length) {
                this.navigation.sidebarDropdown = this.navigation.tabs

                // this.navigation.tabs.map(tab => {
                //     this.webeditor.sidebarTop = this.headerAppend({
                //         ...tab,
                //     })
                // })
            }
        }
    }

    private mergeUserAppearance() {
        const update: DeepPartial<ThemeSettings> = {
            appearance: this.userAppearance
        }

        if (this.originalTheme.coder) {
            update.coder = this.originalTheme.coder
        }

        this.update(update)
    }

    private resetWebeditor() {
        for (const key in this.webeditor) {
            this.webeditor[key] = this.originalWebeditor[key] || []
        }
    }

    private resetNavigation() {
        for (const key in this.navigation) {
            this.navigation[key] = this.originalNavigation[key] || []
        }
    }

    private insertCenterHeaderTabs() {
        const tabsWithFloat = this.navigation?.tabs?.map(item => ({
            ...item,
            float: "center" as const
        })) ?? []

        const searchIndex = this.webeditor.header?.findIndex(item => item.component === "Search") ?? -1
        const currentHeader = this.webeditor.header ?? []

        if (searchIndex !== -1) {
            // Insert tabs after Search component
            this.webeditor.header = [
                ...currentHeader.slice(0, searchIndex + 1),
                ...tabsWithFloat,
                ...currentHeader.slice(searchIndex + 1)
            ]
        } else {
            // If no Search component, insert at the beginning
            this.webeditor.header = [
                ...tabsWithFloat,
                ...currentHeader
            ]
        }
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