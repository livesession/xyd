import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigation } from "react-router";

import { Metadata, Settings, LanguageNavigation, TranslationCatalog, resolveI18nString } from "@xyd-js/core";
import { Banner } from "@xyd-js/components/writer";
import { type ITOC, type IBreadcrumb, type INavLinks, ProgressBar } from "@xyd-js/ui";

import { FwSidebarItemProps } from "../components/FwSidebarItem";
import { SurfaceContext } from "../components/Surfaces";
import { Surfaces } from "../../../src"

export interface IFrameworkI18n {
    currentLocale: string
    defaultLocale: string
    locales: Array<{ code: string, name?: string }>
    byLocale: Readonly<Record<string, LanguageNavigation>>
    catalogs: Readonly<Record<string, TranslationCatalog>>
}

export interface IFramework {
    settings: Readonly<Settings>

    sidebarGroups: Readonly<FwSidebarItemProps[]>
    metadata: Readonly<Metadata>
    setMetadata: (metadata: Metadata) => void
    components?: Readonly<{ [componentName: string]: React.ComponentType<any> }>
    BannerContent: React.ComponentType<any> | null

    /** i18n state. `undefined` when navigation.languages[] isn't configured. */
    i18n?: Readonly<IFrameworkI18n>
}

const framework: IFramework = {
    settings: {},
    metadata: {
        title: "",
    },
    sidebarGroups: [],
    setMetadata: () => {
    },
    components: {},
    BannerContent: null,
}
const FrameworkContext = createContext<IFramework>(framework)

export interface FrameworkProps {
    children: React.ReactNode

    settings: Settings,
    metadata: Metadata,
    sidebarGroups: FwSidebarItemProps[],
    surfaces: Surfaces,
    components?: { [componentName: string]: React.ComponentType<any> },
    BannerContent: React.ComponentType<any>
    /** i18n state. Pass when serving a locale-aware request. */
    i18n?: IFrameworkI18n
}

export function Framework(props: FrameworkProps) {
    const navigation = useNavigation()

    const [metadata, setMetadata] = useState<Metadata | undefined>(props.metadata)

    const BannerContent = props.BannerContent || null
    const BannerComponent = props?.settings?.components?.banner?.kind === "secondary" ? Banner.Secondary : Banner
    const appearance = props.settings.theme?.appearance

    return <>
        <FrameworkContext.Provider value={{
            settings: Object.freeze({ ...props.settings }),
            sidebarGroups: Object.freeze([...props.sidebarGroups]),
            metadata: Object.freeze({ ...metadata, title: metadata?.title || "" }),
            setMetadata: setMetadata,
            components: Object.freeze(props.components || {}),
            BannerContent: props.BannerContent || null,
            i18n: props.i18n ? Object.freeze(props.i18n) : undefined,
        }}>
            <SurfaceContext.Provider value={{
                surfaces: props.surfaces
            }}>
                <ProgressBar isActive={navigation.state === 'loading'} />
                {BannerContent && !appearance?.banner?.fixed ? <BannerComponent
                    label={props.settings?.components?.banner?.label}
                    icon={props.settings?.components?.banner?.icon}
                    href={props.settings?.components?.banner?.href}
                >
                    <BannerContent />
                </BannerComponent> : null}
                {props.children}
            </SurfaceContext.Provider>
        </FrameworkContext.Provider>
    </>
}

interface FrameworkPageProps {
    children: React.ReactNode

    ContentComponent?: (props: { components: any, children: React.ReactNode }) => React.JSX.Element
    ContentOriginal?: (props: { components: any, children: React.ReactNode }) => React.JSX.Element

    metadata: Metadata
    breadcrumbs?: IBreadcrumb[],
    rawPage?: string
    toc?: ITOC[],
    navlinks?: INavLinks
    editLink?: string
}

interface IFrameworkPageContext {
    ContentComponent: (props: { components: any, children?: React.ReactNode }) => React.JSX.Element
    ContentOriginal: (props: { components: any, children?: React.ReactNode }) => React.JSX.Element
    metadata: Readonly<Metadata>
    breadcrumbs?: Readonly<IBreadcrumb[]>
    rawPage?: Readonly<string>
    toc?: Readonly<ITOC[]>
    navlinks?: Readonly<INavLinks>
    editLink?: Readonly<string>
}

const FrameworkPageContext = createContext<IFrameworkPageContext>({
    ContentComponent: () => <></>,
    ContentOriginal: () => <></>,
    metadata: {
        title: "",
    }
})

export function FrameworkPage(props: FrameworkPageProps) {
    const { setMetadata } = useContext(FrameworkContext)

    useEffect(() => {
        setMetadata(props.metadata)
    }, [])

    return <FrameworkPageContext.Provider value={{
        ContentComponent: props.ContentComponent || (() => <></>),
        ContentOriginal: props.ContentOriginal || (() => <></>),
        metadata: Object.freeze(props.metadata),
        breadcrumbs: Object.freeze(props.breadcrumbs),
        rawPage: Object.freeze(props.rawPage),
        toc: Object.freeze(props.toc || []),
        navlinks: Object.freeze(props.navlinks),
        editLink: Object.freeze(props.editLink),
    }}>
        {props.children}
    </FrameworkPageContext.Provider>
}

export function useSidebarGroups() {
    const ctx = useContext(FrameworkContext)

    return ctx.sidebarGroups
}

export function useSettings() {
    const ctx = useContext(FrameworkContext)

    return ctx.settings
}

export function useMetadata() {
    const ctx = useContext(FrameworkContext)

    return ctx.metadata
}

export function useComponents() {
    const ctx = useContext(FrameworkContext)

    return ctx.components
}

export function useToC() {
    const ctx = useContext(FrameworkPageContext)
    const toc = ctx.toc || [] // TODO: !!! `|| []` IS NEEDED CUZ ISSUES WITH HYDRATION !!!

    return toc
}

export function useBreadcrumbs() {
    const ctx = useContext(FrameworkPageContext)

    return ctx.breadcrumbs
}

export function useNavLinks() {
    const ctx = useContext(FrameworkPageContext)

    return ctx.navlinks
}

export function useEditLink() {
    const ctx = useContext(FrameworkPageContext)

    return ctx.editLink
}

export function useRawPage() {
    const ctx = useContext(FrameworkPageContext)

    return ctx.rawPage
}

export function useContentComponent() {
    const ctx = useContext(FrameworkPageContext)

    return ctx.ContentComponent
}

// TODO: !!! IN THE FUTURE BETTER API !!!
export function useContentOriginal() {
    const ctx = useContext(FrameworkPageContext)

    return ctx.ContentOriginal
}

export function useAppearance() {
    const ctx = useContext(FrameworkContext)

    return ctx.settings.theme?.appearance
}

export function useBannerContent() {
    const ctx = useContext(FrameworkContext)

    return ctx.BannerContent
}

export function useShowColorSchemeButton() {
    const ctx = useContext(FrameworkContext)

    const showColorSchemeButton = ctx.settings.theme?.appearance?.colorScheme !== false
        && ctx.settings.theme?.appearance?.colorSchemeButton !== false

    return showColorSchemeButton
}

// ---------- i18n hooks ----------

/**
 * Current locale code (e.g. "en", "pl"). Returns undefined when i18n is
 * not configured.
 */
export function useCurrentLocale(): string | undefined {
    const ctx = useContext(FrameworkContext)
    return ctx.i18n?.currentLocale
}

/**
 * Default locale code. Returns undefined when i18n is not configured.
 */
export function useDefaultLocale(): string | undefined {
    const ctx = useContext(FrameworkContext)
    return ctx.i18n?.defaultLocale
}

/**
 * List of available locales `{ code, name }`. Empty when i18n is not
 * configured.
 */
export function useAvailableLocales(): Array<{ code: string, name?: string }> {
    const ctx = useContext(FrameworkContext)
    return ctx.i18n?.locales ?? []
}

/**
 * Resolve a single string against the current locale's translation
 * catalog. Strings without the `i18n:` prefix pass through unchanged;
 * strings of the form `"i18n: foo.bar"` are looked up in the catalog
 * (current locale, then default locale, then literal key fallback).
 */
export function useT(): (value: string) => string {
    const ctx = useContext(FrameworkContext)
    const i18n = ctx.i18n
    return (value: string) => {
        if (!i18n) return value
        return resolveI18nString(value, i18n.currentLocale, i18n.defaultLocale, i18n.catalogs)
    }
}