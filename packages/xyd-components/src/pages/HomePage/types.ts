import React from "react"

export interface IHomePageHero {
    // The main text for the hero section. This will be defined
    // as `h1` tag.
    text: string

    // Whether to apply text effect on `text`. Defaults to `false`.
    textEffect?: boolean

    // Subtitle displayed below `text`.
    subtitle?: string | React.ReactNode

    // Action buttons to display in home hero section.
    actions?: IHomePageHeroAction[]
}

export interface IHomePageHeroAction {
    // Label of the button.
    text: string

    // Color theme of the button. Defaults to `brand`.
    kind?: 'secondary'

    // Link href attribute.
    href?: string
}

export interface IHomePageFeature {
    // Title of the feature.
    title: string

    // Details of the feature.
    description: string | React.ReactNode

    // Show icon on each feature box.
    icon?: React.ReactNode

    // Link href attribute
    href?: string
}