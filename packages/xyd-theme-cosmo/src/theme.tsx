import React from "react"

import { Theme as ThemeSettings } from "@xyd-js/core"
import { BaseTheme } from "@xyd-js/themes"

// @ts-ignore
import { SearchButton } from 'virtual-component:Search'

import { syntaxThemeCosmo } from "./syntaxTheme"

import "./imports.css"

import "@xyd-js/themes/index.css"

import './index.css';
import './override.css';
import './vars.css';

export default class ThemeCosmo extends BaseTheme {
    constructor() {
        super();

        if (this.settings?.coder) {
            this.settings.coder.syntaxHighlight = syntaxThemeCosmo;
        } else {
            this.settings.coder = {
                syntaxHighlight: syntaxThemeCosmo,
            }
        }

        this.surfaces.define("nav.right", <_Search />)
    }
}


function _Search() {
    return <SearchButton />
}


