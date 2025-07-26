import React from "react"

import {BaseTheme} from "@xyd-js/themes"

import "./imports.css"

import "@xyd-js/themes/index.css"

import './index.css';
import './vars.css';
import './override.css';

export default class ThemePoetry extends BaseTheme {
    constructor() {
        super();

        this.theme.Update({
            coder: {
                syntaxHighlight: "dark-plus"
            },
            appearance: {
                logo: {
                    sidebar: true
                }
            }
        })
    }
}
