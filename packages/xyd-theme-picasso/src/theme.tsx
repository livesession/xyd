import React from "react"

import {BaseTheme} from "@xyd-js/themes"

import "./imports.css"

import "@xyd-js/themes/index.css"

import './index.css';
import './vars.css';
import './override.css';

import syntaxHighlight from "./syntaxHighlight"

export default class ThemePicasso extends BaseTheme {
    constructor() {
        super();

        this.theme.Update({
            coder: {
                syntaxHighlight: syntaxHighlight
            },
            appearance: {
                header: {
                    separator: "right"
                },
                logo: {
                    header: "mobile",
                    sidebar: true
                }
            }
        })
    }
}



