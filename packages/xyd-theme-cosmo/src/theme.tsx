import React from "react"

import { BaseTheme } from "@xyd-js/themes"
import { useComponents } from "@xyd-js/framework/react"

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

        // this.surfaces.define("nav.right", <_Search />)
    }
}


function _Search() {
    const components = useComponents()

    const SearchComponent = components?.Search
    if (!SearchComponent) {
        return null
    }

    return <SearchComponent />
}


