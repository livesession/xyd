import React from "react"

import { css } from "@linaria/core"
import { BaseTheme } from "@xyd-js/themes"
import { FwLogo, useShowColorSchemeButton } from "@xyd-js/framework/react"
import { ColorSchemeButton } from "@xyd-js/components/writer"

import "@xyd-js/themes/index.css"

import "./index.css"
import "./vars.css"

const styles = {
    SidebarBanner: css`
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 8px 12px;
    `
}

function SidebarTop() {
    const showColorSchemeButton = useShowColorSchemeButton()

    return <div className={styles.SidebarBanner} data-testid="custom-sidebar-top">
        <FwLogo />
        <div>
            {showColorSchemeButton && <ColorSchemeButton />}
        </div>
    </div>
}

export default class CustomAdvancedTheme extends BaseTheme {
    constructor() {
        super()

        this.theme.Update({
            appearance: {
                logo: {
                    header: true
                },
                search: {
                    sidebar: true
                },
                content: {
                    breadcrumbs: true
                },
                buttons: {
                    rounded: "lg"
                }
            }
        })

        this.surfaces.define("sidebar.top", <SidebarTop />)
    }
}