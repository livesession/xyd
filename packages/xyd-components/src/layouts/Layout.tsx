import React, {useEffect, useState} from "react"

import {$layout, $page, $article, globalHeaderHeight} from "./Layout.styles"

export interface LayoutProps {
    header: React.ReactNode;
    aside: React.ReactNode;
    content: React.ReactNode;
    contentNav: React.ReactNode;
    subheader?: boolean;
    kind?: "fullwidth"
}


export function Layout(props: LayoutProps) {
    const [hideMainHeader, setHideMainHeader] = useState(false)
    const [lastScrollTop, setLastScrollTop] = useState(0)

    function handleScroll(e) {
        console.log("scrolling")
    }

    // TODO: by ref?
    useEffect(() => {
        if (!props.subheader) {
            return
        }

        document.querySelector(`.${$page.scroll}`)?.addEventListener("scroll", (e) => {
            // @ts-ignore
            const scrollTop = e.target?.scrollTop

            setLastScrollTop(scrollTop)

            if (!lastScrollTop || (scrollTop >= lastScrollTop)) {
                if (scrollTop > parseInt(globalHeaderHeight, 10)) {
                    setHideMainHeader(true)
                }
            } else {
                if (lastScrollTop - scrollTop > (parseInt(globalHeaderHeight, 10) / 2)) {
                    setHideMainHeader(false)
                }
            }
        })

        return () => {
            document.querySelector(`.${$page.scroll}`)?.removeEventListener("scroll", handleScroll)
        }
    }, [lastScrollTop]);

    return <div className={$layout.host}>
        <header className={`
            ${$layout.header}
            ${props.subheader && $layout.header$$sub}
            ${hideMainHeader && $layout.header$$hideMain}
        `}>
            {props.header}
        </header>
        <main className={`
            ${$layout.main}
            ${!hideMainHeader && props.subheader && $layout.main$$sub}
        `}>
            <aside className={$layout.sidebar}>
                {props.aside}
            </aside>
            <div className={$page.host}>
                <div className={$page.scroll}>
                    <div className={$page.container}>
                        <div className={`
                            ${$page.articleContainer}
                            ${props.kind == "fullwidth" && $page.articleContainer$$fullWidth}
                        `}>
                            <article className={$article.host}>
                                <section className={$article.content}>
                                    {props.content}
                                </section>
                                {
                                    props.kind != "fullwidth" && <nav className={`
                                    ${$article.nav}
                                `}>
                                        {props.contentNav}
                                    </nav>
                                }
                            </article>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
}