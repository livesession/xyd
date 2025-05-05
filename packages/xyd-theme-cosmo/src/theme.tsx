import React from "react"

import { Theme as ThemeSettings } from "@xyd-js/core"
import { BaseTheme } from "@xyd-js/themes"

// @ts-ignore
import { SearchButton } from 'virtual-component:Search'

import { syntaxThemeCosmoLight } from "./syntaxTheme"

import "./imports.css"

import "@xyd-js/themes/index.css"

import './index.css';
import './override.css';
import './vars.css';

export default class ThemeCosmo extends BaseTheme {
    constructor(
        settings: ThemeSettings,
        surfaces: any
    ) {
        super(settings);
        if (settings?.markdown) {
            settings.markdown.syntaxHighlight = syntaxThemeCosmoLight;
        } else {
            settings.markdown = {
                syntaxHighlight: syntaxThemeCosmoLight,
            }
        }

        // TODO: BETTER API !!!
        if (surfaces) {
            surfaces["nav.right"] = () => <Search />
        }
    }
}


function Search() {
    return <SearchButton />
}


