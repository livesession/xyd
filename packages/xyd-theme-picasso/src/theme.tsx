import React from "react"

import { Hr } from "@xyd-js/components/writer"
import { UISidebar } from "@xyd-js/ui"
import { FwLogo, FwNav, useComponents } from "@xyd-js/framework/react"
import { SurfaceTarget } from "@xyd-js/framework"
import { BaseTheme } from "@xyd-js/themes"

import syntaxHighlight from "./syntaxHighlight"

import "./imports.css"

import "@xyd-js/themes/index.css"

import './index.css';
import './override.css';
import './vars.css';

export default class ThemePicasso extends BaseTheme {
    constructor() {
        super();

        if (this.settings?.coder) {
            this.settings.coder.syntaxHighlight = syntaxHighlight;
        } else {
            this.settings.coder = {
                syntaxHighlight: syntaxHighlight,
            }
        }

        this.surfaces.define(SurfaceTarget.SidebarTop, <_SidebarTop />);
    }

    protected Navbar() {
        return <>
            <FwNav />
        </>
    }

    public override reactContentComponents() {
        const components = super.reactContentComponents();
        const H2 = components.h2;

        return {
            ...components,
            h2: (props: any) => {
                return <>
                    <Hr />
                    <H2 {...props} />
                </>
            },
        }
    }
}

function _SidebarTop() {
    const components = useComponents()

    const SearchComponent = components?.Search
    if (!SearchComponent) {
        return null
    }

    return <>
        <UISidebar.Item button anchor>
            <div part="logo">
                <FwLogo />
            </div>
        </UISidebar.Item>
    </>
}

