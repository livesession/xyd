import React from "react"

import { BaseTheme } from "@xyd-js/themes"

import "./imports.css"

import "@xyd-js/themes/index.css"

import './index.css';
import './vars.css';
import './override.css';

export default class ThemeTerrarium extends BaseTheme {
    constructor() {
        super()

        this.theme.Update({
            coder: {
                syntaxHighlight: "dark-plus"
            },
            appearance: {
                logo: {
                    header: true
                },
                search: {
                    sidebar: "mobile",
                    // the nav CENTER hosts the per-product tabs — search lives on
                    // the RIGHT so they never collide
                    right: "desktop"
                },
                content: {
                    breadcrumbs: true
                },
                tabs: {
                    // per-product `appearance:"tabs"` segments render in the nav center
                    surface: "center"
                },
                sidebar: {
                    scrollbar: "secondary",
                    scrollTransition: "smooth",
                    groupCase: "none",
                    // the whole sidebar scrolls (full-height scrollbar); the fixed
                    // region (filter / switcher / pinned components) sticks on top
                    scroll: "sidebar"
                }
            }
        })

        // The sidebar's fixed (pinned) region hosts the built-in filter
        // (components.filterSidebar) + any `{ fixed: true }` sidebar components.
    }
}
