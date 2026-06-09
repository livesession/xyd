import React, { useEffect } from "react"
import type { Preview, Decorator } from "@storybook/react"

import poetryCss from "@xyd-js/theme-poetry/index.css?url"
import openerCss from "@xyd-js/theme-opener/index.css?url"
import cosmoCss from "@xyd-js/theme-cosmo/index.css?url"
import picassoCss from "@xyd-js/theme-picasso/index.css?url"
import gustoCss from "@xyd-js/theme-gusto/index.css?url"
import solarCss from "@xyd-js/theme-solar/index.css?url"

import "./styles.css"

const THEME_CSS: Record<string, string> = {
    solar: solarCss,
    poetry: poetryCss,
    opener: openerCss,
    cosmo: cosmoCss,
    picasso: picassoCss,
    gusto: gustoCss,
}

const DEFAULT_THEME = "solar"

// Swap the <link> tag in <head> so only the selected theme's CSS is applied. Mirrors
// apps/apidocs-demo/app/routes/layout.tsx — load new CSS first, then remove the old.
async function applyTheme(themeName: string) {
    const href = THEME_CSS[themeName] || THEME_CSS[DEFAULT_THEME]

    const existing = document.querySelector<HTMLLinkElement>(
        `link[data-xyd-theme][href="${href}"]`,
    )
    if (existing) {
        document
            .querySelectorAll<HTMLLinkElement>("link[data-xyd-theme]")
            .forEach((el) => {
                if (el !== existing) el.remove()
            })
        return
    }

    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = href
    link.setAttribute("data-xyd-theme", themeName)

    await new Promise<void>((resolve, reject) => {
        link.onload = () => resolve()
        link.onerror = () => reject(new Error(`Failed to load theme CSS: ${themeName}`))
        document.head.appendChild(link)
    })

    document
        .querySelectorAll<HTMLLinkElement>("link[data-xyd-theme]")
        .forEach((el) => {
            if (el !== link) el.remove()
        })
}

const withTheme: Decorator = (Story, context) => {
    const themeName = (context.globals.theme as string) || DEFAULT_THEME

    useEffect(() => {
        applyTheme(themeName)
    }, [themeName])

    return React.createElement(Story)
}

const preview: Preview = {
    globalTypes: {
        theme: {
            name: "Theme",
            description: "xyd theme",
            defaultValue: DEFAULT_THEME,
        },
    },
    decorators: [withTheme],
    parameters: {
        options: {
            storySort: {
                order: [
                    "Components", ["Writer", "Coder"],
                    "Atlas",
                    "UI",
                    "Layouts",
                    "Themes", ["Default", "Design System"],
                ],
            },
        },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
        docs: {
            source: {
                state: "open",
                type: "auto",
                excludeDecorators: true,
            },
        },
    },
}

export default preview
