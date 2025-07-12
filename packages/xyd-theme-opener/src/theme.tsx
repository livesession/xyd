import React, { } from "react"

import { BaseTheme } from "@xyd-js/themes"

import "./imports.css"

import "@xyd-js/themes/index.css"

import './index.css';
import './vars.css';
import './override.css';

export default class ThemeOpener extends BaseTheme {
    constructor() {
        super()

        this.theme.Update({
            coder: {
                syntaxHighlight: "dark-plus"
            },
            appearance: {
                "buttons": {
                    "rounded": true
                },
                search: {
                    fullWidth: true,
                    sidebar: "mobile",
                    middle: "desktop"
                },
                header: {
                    externalArrow: true,
                    separator: "right"
                },
                sidebar: {
                    externalArrow: true,
                    scrollShadow: true,
                    scrollbar: "secondary"
                },
                writer: {
                    contentDecorator: "secondary"
                },
            }
        })
    }
}
