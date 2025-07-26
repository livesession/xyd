import React, {} from "react"

import {BaseTheme} from "@xyd-js/themes"
import syntaxThemeClassic from "@xyd-js/components/coder/themes/classic.js"

import "./imports.css"

import "@xyd-js/themes/index.css"
import "@xyd-js/components/coder/themes/classic.css"

import './index.css';
import './vars.css';
import './override.css';

export default class ThemeSolar extends BaseTheme {
    constructor() {
        super()

        this.theme.Update({
            coder: {
                syntaxHighlight: syntaxThemeClassic
            },
            appearance: {
                logo: {
                    header: true,
                    sidebar: "mobile"
                },
                search: {
                    fullWidth: true,
                    middle: "desktop",
                    sidebar: "mobile"
                },
                content: {
                    breadcrumbs: true,
                }
            }
        })
    }
}