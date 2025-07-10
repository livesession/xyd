import React, { } from "react"

import { BaseTheme } from "@xyd-js/themes"

import "./imports.css"

import "@xyd-js/themes/index.css"

import './index.css';
import './override.css';
import './vars.css';

export default class ThemeOpener extends BaseTheme {
    constructor() {
        super()

        this.theme.Set("coder.syntaxHighlight", "dark-plus")
        this.theme.Set("appearance.writer.contentDecorator", "secondary")
    }
}
