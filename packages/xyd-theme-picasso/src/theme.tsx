import React from "react"

import {UISidebar} from "@xyd-js/ui"
import {FwLogo} from "@xyd-js/framework/react"
import {SurfaceTarget} from "@xyd-js/framework"
import {BaseTheme} from "@xyd-js/themes"

import syntaxHighlight from "./syntaxHighlight"

import "./imports.css"

import "@xyd-js/themes/index.css"

import './index.css';
import './vars.css';
import './override.css';

export default class ThemePicasso extends BaseTheme {
    constructor() {
        super();

        this.theme.Update({
            coder: {
                syntaxHighlight: syntaxHighlight
            },
            appearance: {
                writer: {
                    contentDecorator: "secondary"
                },
                header: {
                    separator: "right"
                }
            }
        })

        this.surfaces.define(SurfaceTarget.SidebarTop, <_SidebarTop/>);
    }
}

// TODO: this also should be a built-in
function _SidebarTop() {
    return <>
        <UISidebar.Item button ghost>
            <div part="logo">
                <FwLogo/>
            </div>
        </UISidebar.Item>
    </>
}

