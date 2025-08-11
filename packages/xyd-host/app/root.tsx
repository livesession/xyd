import React, { useEffect } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, redirect } from "react-router";

import type { Settings, Appearance, ThemeFont, Font, UserPreferences } from "@xyd-js/core";
import * as contentClass from "@xyd-js/components/content"; // TODO: move to appearance

// @ts-ignore
import virtualSettings from "virtual:xyd-settings";
// @ts-ignore
import { presetUrls } from "virtual:xyd-theme-presets"

import colorSchemeScript from "./scripts/colorSchemeScript.ts?raw";
import bannerHeightScript from "./scripts/bannerHeight.ts?raw";

import openfeatureScript from "./scripts/openfeature.js?raw";
import abTestingScript from "./scripts/abtesting.ts?raw";

import growthbookScript from "./scripts/growthbook.js?raw";
import openfeatureGrowthbookScript from "./scripts/openfeature.growthbook.js?raw";

import launchdarklyScript from "./scripts/launchdarkly.js?raw";
import openfeatureLaunchdarklyScript from "./scripts/openfeature.launchdarkly.js?raw";

const { settings, userPreferences } = virtualSettings as { settings: Settings, settingsClone: Settings, userPreferences: UserPreferences }

export function HydrateFallback() {
    return <div></div>
}

export function loader({ request }: { request: any }) {
    if (process.env.NODE_ENV === "production") {
        return
    }

    const slug = getPathname(request.url || "index") || "index"

    if (settings?.redirects) {
        const shouldRedirect = settings.redirects.find((redirect: any) => redirect.source === slug)
        if (shouldRedirect) {
            return redirect(shouldRedirect.destination)
        }
    }
}

export function Layout({ children }: { children: React.ReactNode }) {
    const colorScheme = clientColorScheme() || settings?.theme?.appearance?.colorScheme || "os"

    const { component: UserAppearance, classes: UserAppearanceClasses } = userAppearance()

    return (
        <html
            data-color-scheme={colorScheme}
            data-color-primary={settings?.theme?.appearance?.colors?.primary ? "true" : undefined}
        >

            <head>
                <PreloadScripts />
                <DefaultMetas />
                <CssLayerFix />

                <UserFavicon />
                <UserHeadScripts />
                <UserFonts />

                <Meta />
                <Links />
                <PresetStyles />
            </head>

            <body className={UserAppearanceClasses}>
                {children}
                <ScrollRestoration />
                <Scripts />
                <UserStyleTokens />
                <UserPreferenceStyles />
                {UserAppearance}
                {/* TODO: in the future better solution? */}
            </body>
        </html>
    );
}

function PreloadScripts() {
    return <>
        <ABTestingScript />
        <ColorSchemeScript />
        {/* TODO: in the future better solution? */}
        <BannerHeightScript />
    </>
}

function clientColorScheme() {
    if (typeof window === "undefined") {
        return
    }

    try {
        var theme = localStorage.getItem('xyd-color-scheme') || 'auto';
        var isDark = false;

        if (theme === 'dark') {
            isDark = true;
        } else if (theme === 'auto') {
            isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        return isDark ? "dark" : undefined
    } catch (e) {
        // Fallback to system preference if localStorage fails
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return "dark"
        }
    }

    return undefined
}

export default function App() {
    return <Outlet />;
}

function getPathname(url: string) {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname.replace(/^\//, '');
}


function DefaultMetas() {
    return <>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
    </>
}

function ColorSchemeScript() {
    return <script
        dangerouslySetInnerHTML={{
            __html: colorSchemeScript
        }}
    />
}

// TODO: check if it match good
function BannerHeightScript() {
    const appearance = settings?.theme?.appearance

    useEffect(() => {
        const bannerHeight = document.querySelector("xyd-banner")?.clientHeight ?? 0;
        if (!bannerHeight) {
            return
        }
        document.documentElement.style.setProperty("--xyd-banner-height", `${String(bannerHeight)}px`)

        if (!appearance?.banner?.fixed) {
            return
        }

        document.documentElement.style.setProperty("--xyd-banner-height-dynamic", `${String(bannerHeight)}px`)
    }, [])

    return null

    return <script
        dangerouslySetInnerHTML={{
            __html: bannerHeightScript
        }}
    />
}

function UserFavicon() {
    const faviconPath = settings?.theme?.favicon

    if (!faviconPath) {
        return null
    }

    return <link rel="icon" type="image/png" sizes="32x32" href={faviconPath}></link>
}

// TODO: !!! in the future more developer-friendly code + bundle optimization !!!
function ABTestingScript() {
    const abtesting = settings?.integrations?.abtesting
    const providers = settings?.integrations?.abtesting?.providers || {}

    if (!providers || !Object.keys(providers).length) {
        return null
    }

    const scripts = [
        openfeatureScript,
    ]

    if (providers?.growthbook) {
        scripts.push(growthbookScript)
        scripts.push(openfeatureGrowthbookScript)
    }

    if (providers?.launchdarkly) {
        scripts.push(launchdarklyScript)
        scripts.push(openfeatureLaunchdarklyScript)
    }

    scripts.push(abTestingScript)

    const allScripts = scripts.join('\n');

    // Inject settings into the script
    const scriptWithSettings = `
        window.__xydAbTestingSettings = ${JSON.stringify(abtesting)};
        ${allScripts}
    `;

    return <script
        dangerouslySetInnerHTML={{
            __html: scriptWithSettings
        }}
    />
}

// TODO: better than <style>?
function UserStyleTokens() {
    const userCss = generateUserCss(settings?.theme?.appearance)

    if (!userCss) {
        return null
    }

    return <>
        <style
            data-appearance
            dangerouslySetInnerHTML={{
                __html: userCss
            }}
        />
    </>
}

function UserPreferenceStyles() {
    const themeColors = userPreferences?.themeColors
    if (!themeColors) {
        return null
    }

    const coderPreferences = tokensToCss({
        "--user-codetabs-bgcolor": "none",
        "--user-codetabs-color": "none",
        "--user-codetabs-color--active": "currentColor",
        "--user-codetabs-color--hover": "none",
        "--user-coder-code-border-color": "none",
        "--xyd-coder-code-mark-bgcolor": `color-mix(in srgb, ${themeColors.foreground} 10%, transparent)`
    });
    const css = [
        coderPreferences
    ].filter(Boolean).join('\n\n');

    return <>
        <style dangerouslySetInnerHTML={{ __html: css }} />
    </>
}

// TODO: better than <style>?
function userAppearance() {
    const theme = {
        searchWidth: settings?.theme?.appearance?.search?.fullWidth ? "100%" : undefined,
        buttonsRounded: cssVarSize("--xyd-border-radius", settings?.theme?.appearance?.buttons?.rounded, "lg"),
        scrollbarColor: settings?.theme?.appearance?.sidebar?.scrollbarColor || undefined
    }

    const userAppearanceCss = tokensToCss({
        "--xyd-search-width": theme.searchWidth || undefined,
        "--xyd-button-border-radius": theme.buttonsRounded || undefined,
        "--decorator-sidebar-scroll-bgcolor": theme.scrollbarColor || undefined
    })

    if (!userAppearanceCss) {
        return {
            component: null,
            classes: ""
        }
    }

    const classes = []
    if (settings?.theme?.appearance?.search?.fullWidth) {
        classes.push(contentClass.SearchButtonFullWidth)
    }

    return {
        component: <style
            dangerouslySetInnerHTML={{
                __html: userAppearanceCss
            }}
        />,
        classes: classes.join(" ")
    }
}

function generateUserCss(appearance?: Appearance): string {
    if (!appearance) return '';

    const { colors, cssTokens } = appearance;

    const lightTokens = {
        ...(colors?.primary ? generateColorTokens(colors.primary) : {}),
        ...(cssTokens ? cssTokens : {}),
        // ...(sidebar?.scrollbarColor ? { "--xyd-toc-scroll-bgcolor": sidebar.scrollbarColor } : {})
    };
    const darkTokens = {
        ...(colors?.light ? generateColorTokens(colors.light) : {}),
        ...(cssTokens ? cssTokens : {}),
        // ...(sidebar?.scrollbarColor ? { "--xyd-toc-scroll-bgcolor": sidebar.scrollbarColor } : {})
    };

    const lightCss = tokensToCss(lightTokens);
    const darkCss = generateDarkCss(darkTokens);

    return [lightCss, darkCss].filter(Boolean).join('\n\n');
}

// TODO: typesafe css variables?
function generateColorTokens(primary: string): Record<string, string> {
    return {
        "--color-primary": primary,
        "--xyd-sidebar-item-bgcolor--active": 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
        "--xyd-sidebar-item-color--active": 'var(--color-primary)',
        "--xyd-toc-item-color--active": 'var(--color-primary)',
        "--theme-color-primary": 'var(--color-primary)',
        "--theme-color-primary-active": 'var(--color-primary)',
        "--color-primary--active": 'color-mix(in srgb, var(--color-primary) 85%, transparent)',
    };
}

function tokensToCss(tokens: Record<string, string | boolean | undefined>, wrapInRoot = true): string {
    if (!Object.keys(tokens).length) {
        return '';
    }

    const props = Object.entries(tokens)
        .filter(([key, value]) => value !== undefined)
        .map(([key, value]) => `${key}: ${value};`)
        .join('\n');

    return wrapInRoot ? `:root {\n${props}\n}` : props;
}

function generateDarkCss(tokens: Record<string, string>): string {
    if (!Object.keys(tokens).length) {
        return '';
    }

    const raw = tokensToCss(tokens, false);
    return [
        `[data-color-scheme="dark"] {\n${raw}\n}`,
        `@media (prefers-color-scheme: dark) {`,
        `    :root:not([data-color-scheme="light"]):not([data-color-scheme="dark"]) {\n        ${raw.replace(/\n/g, '\n        ')}\n    }`,
        `}`
    ].join('\n');
}

function UserHeadScripts() {
    const head = settings?.theme?.head || []

    if (!head || !head.length) {
        return null
    }

    return head.map(([tag, rawProps, content]: [string, Record<string, string | boolean>, string?], index: number) => {
        const props: Record<string, any> = { ...rawProps }

        const onload = props.onLoad || props.onload

        // Convert onLoad from string to function
        if (typeof onload === 'string') {
            const fnBody = onload
            props.onLoad = () => {
                // eslint-disable-next-line no-new-func
                new Function(fnBody)()
            }
        }

        delete props.onload

        if (content) {
            return React.createElement(tag, {
                key: index,
                ...props,
                dangerouslySetInnerHTML: { __html: content },
            })
        }

        return React.createElement(tag, { key: index, ...props })
    })
}

function PresetStyles() {
    const appearance = settings?.theme?.appearance
    const appearancePresets = appearance?.presets || []

    return Object.entries(presetUrls).map(([name, url]) => {
        if (appearancePresets.includes(name)) {
            return <link rel="stylesheet" href={url as string} key={name} />
        }

        return null
    })
}

const cssVarSize = (
    cssTokenPrefix: string,
    size?: "lg" | "md" | "sm" | boolean,
    defaultSize?: "lg" | "md" | "sm"
) => {
    if (!size) {
        return undefined
    }

    if (typeof size === "boolean") {
        return cssVarSize(cssTokenPrefix, defaultSize)
    }

    const sizes = {
        lg: "large",
        md: "medium",
        sm: "small"
    }

    const found = sizes[size]

    if (!found) {
        if (defaultSize) {
            return cssVarSize(cssTokenPrefix, defaultSize)
        }

        return undefined
    }

    return `var(${cssTokenPrefix}-${found})`
}

function UserFonts() {
    const fontConfig = settings?.theme?.fonts

    if (!fontConfig) {
        return null
    }

    const fontCss = generateFontCss(fontConfig)

    if (!fontCss) {
        return null
    }


    return <>
        <style
            data-fonts
            dangerouslySetInnerHTML={{
                __html: fontCss
            }}
        />
    </>
}


// TODO: its a fix for css layers - in the future better solution? is <style> order better?
function CssLayerFix() {
    return <style>
        @layer reset, defaults, defaultfix, components, fabric, templates, decorators, themes, themedecorator, presets, user, overrides;
    </style>
}

function generateFontCss(fontConfig: ThemeFont): string {
    if (!fontConfig) return ''

    // Handle single font configuration
    if ('family' in fontConfig || 'src' in fontConfig) {
        return generateSingleFontCss(fontConfig, 'body')
    }

    // Handle separate body and coder fonts
    const { body, coder } = fontConfig as { body: ThemeFont; coder: ThemeFont }
    const bodyCss = body ? generateSingleFontCss(body, 'body') : ''
    const coderCss = coder ? generateSingleFontCss(coder, 'coder') : ''

    return [bodyCss, coderCss].filter(Boolean).join('\n\n')
}

function generateSingleFontCss(font: ThemeFont, type: 'body' | 'coder'): string {
    if (Array.isArray(font)) {
        // Generate all font-face declarations
        const fontFaces = font.map(f => generateFontFace(f)).join('\n\n')

        // Use only the first font for CSS variables
        const firstFont = font[0]
        const cssVars = generateCssVars(firstFont, type)

        return `${fontFaces}

        @layer user {
        :root {
                ${cssVars}
            }
        }
    `
    }

    if (!("src" in font)) {
        return ''
    }

    if (!font.src) return ''

    const fontFace = generateFontFace(font)
    const cssVars = generateCssVars(font, type)

    return `${fontFace}

        @layer user {
        :root {
                ${cssVars}
            }
        }
    `
}

function fontFormat(font: Font) {
    switch (font.format) {
        case "woff2":
            return "woff2"
        case "woff":
            return "woff"
        case "ttf":
            return "ttf"
    }

    if (font.src?.endsWith(".woff2")) {
        return "woff2"
    }

    if (font.src?.endsWith(".woff")) {
        return "woff"
    }

    if (font.src?.endsWith(".ttf")) {
        return "ttf"
    }

    return ""
}

function generateFontFace(font: Font): string {
    const fontFamily = font.family || 'font'
    const fontWeight = font.weight || '400'
    const format = fontFormat(font)

    if (format) {
        return `@font-face {
            font-family: '${fontFamily}';
            font-weight: ${fontWeight};
            src: url('${font.src}') format('${format}');
            font-display: swap;
        }`
    } else {
        return `@import url('${font.src}');`
    }
}

function generateCssVars(font: Font, type: 'body' | 'coder'): string {
    const fontFamily = font.family || `font-${type}`
    const fontWeight = font.weight || '400'

    const cssVars = {
        [`--font-${type}-family`]: fontFamily,
        [`--font-${type}-weight`]: fontWeight,
    }

    return Object.entries(cssVars)
        .map(([key, value]) => `${key}: ${value};`)
        .join('\n    ')
}
