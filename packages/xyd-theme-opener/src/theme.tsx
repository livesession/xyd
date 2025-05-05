import React, { createContext, useContext, useRef, useState } from "react"

import { Theme as ThemeSettings } from "@xyd-js/core"
import { UISidebar } from "@xyd-js/ui"
import { BaseTheme } from "@xyd-js/themes"
import { ContentDecorator } from "@xyd-js/components/content"
import { FwNavLinks, useMetadata } from "@xyd-js/framework/react"
import { Code, Heading } from "@xyd-js/components/writer"

// @ts-ignore
import { SearchButton } from 'virtual-component:Search'

import "./imports.css"

import "@xyd-js/themes/index.css"

import './index.css';
import './override.css';
import './vars.css';

const Ctx = createContext({})

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

    public components() {
        return {
            // wrapper: ({ children }: { children: React.ReactNode }) => {
            //     // @ts-ignore
            //     const all = []
            //     React.Children.forEach(children, child => {
            //         if (React.isValidElement(child) && child.type === React.Fragment) {
            //             // @ts-ignore
            //             React.Children.forEach(child.props.children, fragChild => {
            //                 // @ts-ignore
            //                 all.push(fragChild)
            //             })
            //         } else {
            //             // @ts-ignore
            //             all.push(child)
            //         }
            //     })

            //     console.log(all, "all2")

            //     return null
            // },
            // wrapper: (props) => {
            //     const ref = useRef<any>(null)
            //     return <Ctx value={{
            //         setH1(h1: React.ReactNode) {
            //             ref.current = h1
            //         },
            //         ref
            //     }}>
            //         {props.children}
            //     </Ctx>
            // },
            // h1: (props) => {
            //     const ctx = useContext(Ctx)
            //     // @ts-ignore
            //     ctx.current.push("HELLO WORLD")

            //     return null
            // },
            h1: () => {
                return null
            },
            Subtitle: () => {
                return null
            }
        }
    }

    protected override Content({ children, Content }: { children: React.ReactNode, Content: any }) {
        const ref = useRef([])
        const meta = useMetadata()
        // const [h1, setH1] = useState<React.ReactNode>(null)


        return <ContentDecorator metaComponent={meta?.component || undefined}>
            <main>
                <div className="opener-heading1-wrapper">
                    <Content components={{ // TODO: !!! BETTER API !!!
                        h1: (props: any) => {
                            return <Heading {...props} />
                        },
                        Subtitle(props: any) {
                            const paragraph = props?.children?.props?.children
                
                            return <Heading size={4} kind="muted" {...props}>
                                {paragraph}
                            </Heading>
                        },
                        code: (props) => {
                            return <Code {...props} />
                        },
                        Callout: () => null,
                        h2: () => null,
                        h3: () => null,
                        h4: () => null,
                        h5: () => null,
                        h6: () => null,
                        pre: () => null,
                        p: () => null,
                        ul: () => null,
                        ol: () => null,
                        li: () => null,
                        blockquote: () => null,
                        DirectiveCodeGroup: () => null,
                        Steps: Steps,
                        UnderlineNav: UnderlineNav,
                        Atlas: () => null,
                        GuideCard: () => null,
                        IconCode: () => null,
                    }}>
                        {children}
                    </Content>
                </div>

                <div className="opener-content">
                    {children}
                    <FwNavLinks />
                </div>
            </main>
        </ContentDecorator>
    }
}

function ContentComponent({ children }: { children: React.ReactNode }) {
    const ctx = useContext(Ctx)
    // @ts-ignore
    // const h1 = ctx.h1?.current
    // @ts-ignore

    return <main>
        <div className="opener-heading1-wrapper">
            {/* @ts-ignore */}
            {ctx.current}
        </div>

        <div className="opener-content">
            {children}
            <FwNavLinks />
        </div>
    </main>
}


function UnderlineNav() {
    return null
}
UnderlineNav.Item = () => null
UnderlineNav.Content = () => null

function Steps() {
    return null
}
Steps.Item = () => null
Steps.Content = () => null

function Search() {
    return <>
        <UISidebar.Item button anchor>
            <SearchButton />
        </UISidebar.Item>
    </>
}