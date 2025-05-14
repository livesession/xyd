import React, { } from "react"

import { UISidebar } from "@xyd-js/ui"
import { BaseTheme } from "@xyd-js/themes"
import { ContentDecorator } from "@xyd-js/components/content"
import { FwNavLinks, FwCopyPage, useMetadata } from "@xyd-js/framework/react"

import { useContentComponent } from "@xyd-js/framework/react";

// @ts-ignore
import { SearchButton } from 'virtual-component:Search'

import "./imports.css"

import "@xyd-js/themes/index.css"

import './index.css';
import './override.css';
import './vars.css';
import { Metadata } from "@xyd-js/core"

export default class ThemeOpener extends BaseTheme {
    constructor() {
        super()

        console.log("ThemeOpener", this.settings)
        if (this.settings.markdown) {
            this.settings.markdown.syntaxHighlight = "dark-plus";
        } else {
            this.settings.markdown = {
                syntaxHighlight: "dark-plus",
            }
        }

        this.surfaces.define("sidebar.top", <_Search />)
    }

    public override reactContentComponents() {
        const meta = useMetadata()

        if (isDefaultContent(meta)) {
            return super.reactContentComponents()
        }
        
        return {
            ...super.reactContentComponents(),
            h1: () => null,
            Subtitle: () => null,
        }
    }

    protected override Content({ children }: { children: React.ReactNode }) {
        const meta = useMetadata()
        const ContentComponent = useContentComponent()
        const OriginalContent = super.Content

        if (isDefaultContent(meta)) {
            return <OriginalContent children={children} />
        }

        const { h1, Subtitle, code } = this.reactContent.components()

        return <ContentDecorator metaComponent={meta?.component || undefined}>
            <main>
                <opener-content>
                    <div part="opener-content-header">
                        <div>
                            <ContentComponent components={{ // TODO: !!! BETTER API !!!
                                ...this.reactContent.noop(),
                                h1,
                                Subtitle,
                                code
                            }}>
                                {children}
                            </ContentComponent>
                        </div>
                        <FwCopyPage />
                    </div>

                    <div part="opener-content">
                        {children}
                        <FwNavLinks />
                    </div>
                </opener-content>
            </main>
        </ContentDecorator>
    }
}

function isDefaultContent(meta: Metadata) {
    return meta?.openapi || meta?.graphql || meta.component === "atlas"
}

function _Search() {
    return <>
        <UISidebar.Item button anchor>
            <SearchButton />
        </UISidebar.Item>
    </>
}

