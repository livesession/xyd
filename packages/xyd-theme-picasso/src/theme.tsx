import React from "react"

import {Hr, Heading} from "@xyd-js/components/writer"
import {UISidebar} from "@xyd-js/ui"
import {FwLogo, SurfaceTarget} from "@xyd-js/framework/react"
import {BaseTheme} from "@xyd-js/themes"

// @ts-ignore
import {SearchButton} from 'virtual-component:Search'

import syntaxHighlight from "./syntaxHighlight"

import "./imports.css"

import "@xyd-js/themes/index.css"

import './index.css';
import './override.css';
import './vars.css';

export default class ThemePicasso extends BaseTheme {
    constructor() {
        super();

        if (this.settings?.markdown) {
            this.settings.markdown.syntaxHighlight = syntaxHighlight;
        } else {
            this.settings.markdown = {
                syntaxHighlight: syntaxHighlight,
            }
        }

        this.surfaces.define(SurfaceTarget.SidebarTop, <_Search/>);
    }

    public override reactContentComponents() {
        const components = super.reactContentComponents();
        const H2 = components.h2;

        return {
            ...components,
            h2: (props: any) => {
                return <>
                    <Hr/>
                    <H2 {...props}/>
                </>
            },
        }
    }
}

function _Search() {
    return <>
        <UISidebar.Item button anchor>
            <a href="/">
                <FwLogo/>
            </a>
        </UISidebar.Item>

        <UISidebar.Item button anchor>
            <SearchButton/>
        </UISidebar.Item>
    </>
}

