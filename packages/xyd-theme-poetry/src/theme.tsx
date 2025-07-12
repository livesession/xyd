import React from "react"

import {UISidebar} from "@xyd-js/ui"
import {FwLogo} from "@xyd-js/framework/react"
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
        })

        this.surfaces.define("sidebar.top", <_SidebarTop/>);
    }
}

function _SidebarTop() {
    return <>
        <UISidebar.Item button ghost>
            <div part="logo">
                <FwLogo/>
            </div>
        </UISidebar.Item>
    </>
}
