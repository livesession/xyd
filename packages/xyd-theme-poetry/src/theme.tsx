import React from "react"

import { Text } from "@xyd-js/components/writer"
import { UISidebar } from "@xyd-js/ui"
import { FwLogo, FwNav } from "@xyd-js/framework/react"
import { BaseTheme } from "@xyd-js/themes"

// @ts-ignore
import { SearchButton } from 'virtual-component:Search'

import "./imports.css"

import "@xyd-js/themes/index.css"

import './index.css';
import './override.css';
import './vars.css';

export default class ThemePoetry extends BaseTheme {
    constructor() {
        super();

        if (this.settings?.coder) {
            this.settings.coder.syntaxHighlight = "dark-plus";
        } else {
            this.settings.coder = {
                syntaxHighlight: "dark-plus",
            }
        }

        this.surfaces.define("sidebar.top", <_Search />);
    }

    protected Navbar() {
        return <>
            <FwNav />
        </>
    }
}

function _Search() {
    return <>
        <UISidebar.Item button anchor>
            <a href="/">
                <FwLogo />
            </a>
        </UISidebar.Item>

        <UISidebar.Item button anchor>
            <SearchButton />
        </UISidebar.Item>
    </>
}

