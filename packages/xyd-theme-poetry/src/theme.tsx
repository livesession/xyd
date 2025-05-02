import React from "react"

import { Theme as ThemeSettings } from "@xyd-js/core"
import { UISidebar } from "@xyd-js/ui"
import { SearchButton } from "@xyd-js/components/system"
import { FwLogo, useSearch } from "@xyd-js/framework/react"
import { BaseTheme } from "@xyd-js/themes"

// @ts-ignore
import { SearchButton as SearchButton2 } from 'virtual:Search'

import "./imports.css"

import "@xyd-js/themes/index.css"

import './index.css';
import './override.css';
import './vars.css';

export default class ThemePoetry extends BaseTheme {
    constructor(
        settings: ThemeSettings,
        surfaces: any
    ) {
        super(settings);

        if (settings?.markdown) {
            settings.markdown.syntaxHighlight = "dark-plus";
        } else {
            settings.markdown = {
                syntaxHighlight: "dark-plus",
            }
        }

        // TODO: BETTER API !!!
        if (surfaces) {
            surfaces["sidebar.top"] = () => <Search />
        }
    }
}

function Search() {
    const { click } = useSearch()

    return <>
        <UISidebar.Item button anchor>
            <a href="/">
                <FwLogo />
            </a>
        </UISidebar.Item>

        <UISidebar.Item button anchor>
            <SearchButton2 />
        </UISidebar.Item>

        {/* <UISidebar.Item button anchor>
            <SearchButton
                onClick={click}
            />
        </UISidebar.Item> */}
    </>
}