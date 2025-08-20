import React, {} from "react"

import {css} from "@linaria/core";

import {ColorSchemeButton} from "@xyd-js/components/writer";
import {UISidebar} from "@xyd-js/ui";
import {BaseTheme} from "@xyd-js/themes"
import {FwLogo, useShowColorSchemeButton} from "@xyd-js/framework/react";
import syntaxThemeClassic from "@xyd-js/components/coder/themes/classic.js"

import "./imports.css"

import "@xyd-js/themes/index.css"
import "@xyd-js/components/coder/themes/classic.css"

import './index.css';
import './vars.css';
import './override.css';

const styles = {
    SidebarTop: css`
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
    `
}

export default class ThemeGusto extends BaseTheme {
    constructor() {
        super()

        this.theme.Update({
            coder: {
                syntaxHighlight: syntaxThemeClassic
            },
            appearance: {
                search: {
                    sidebar: true
                },
                tabs: {
                    surface: "sidebar"
                },
                buttons: {
                    rounded: "lg"
                }
            }
        })

        this.surfaces.define("sidebar.top", <_SidebarTop/>);
    }
}

function _SidebarTop() {
    const showColorSchemeButton = useShowColorSchemeButton()

    return <>
        <UISidebar.Item ghost>
            <div className={styles.SidebarTop}>
                <FwLogo/>
                <div>
                    {showColorSchemeButton && <ColorSchemeButton/>}
                </div>
            </div>
        </UISidebar.Item>
    </>
}


