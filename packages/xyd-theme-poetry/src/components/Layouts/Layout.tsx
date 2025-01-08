import React, {useEffect, useState} from "react"

import {$layout, $page, $article, globalHeaderHeight} from "./Layout.styles"

export interface LayoutProps {
    header: React.ReactNode;
    aside: React.ReactNode;
    content: React.ReactNode;
    contentNav: React.ReactNode;
    subheader?: boolean;
    kind?: "fullwidth" | "equal"
}

// TODO: move scroller to xyd-foo
export function Layout(props: LayoutProps) {
    const [hideMainHeader, setHideMainHeader] = useState(false)
    const [scrollTop, setScrollTop] = useState(0)
    const [controlScrollPos, setControlScrollPos] = useState(0)

    useEffect(() => {
        if (scrollTop === controlScrollPos) {
            return
        }

        const checkpoint = parseInt(globalHeaderHeight, 10) / 2
        const diff = scrollTop - controlScrollPos
        const reversePosDiff = Math.abs(scrollTop - controlScrollPos)

        if (diff > checkpoint) {
            setHideMainHeader(true)
        } else if (reversePosDiff > checkpoint) {
            setHideMainHeader(false)
        }
    }, [
        scrollTop,
        controlScrollPos,
    ]);

    function onScroll(e: Event) {
        if (!(e.target instanceof HTMLElement)) {
            return
        }

        const scroll = e.target?.scrollTop
        setScrollTop(scroll)
    }

    function onScrollFinish(e: Event) {
        if (!(e.target instanceof HTMLElement)) {
            return
        }

        setControlScrollPos(e.target?.scrollTop)
    }

    // TODO: by ref?
    // TODO: MOVE SOMEWHERE ELSE BECAUSE IT DECREASE PERFORMANCE (RERENDER)
    useEffect(() => {
        // return // TODO: UNCOMMENT

        if (!props.subheader) {
            return
        }

        document.querySelector(`.${$page.scroll}`)?.addEventListener("scroll", onScroll)
        document.querySelector(`.${$page.scroll}`)?.addEventListener("scrollend", onScrollFinish)

        return () => {
            document.querySelector(`.${$page.scroll}`)?.removeEventListener("scroll", onScroll)
            document.querySelector(`.${$page.scroll}`)?.removeEventListener("scrollend", onScrollFinish)
        }
    }, []);

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
                            ${props.kind == "equal" && $page.articleContainer$$fullWidth}
                        `}>
                            <article className={$article.host}>
                                <section className={$article.content}>
                                    {props.content}
                                </section>
                                {
                                    props.contentNav && <nav className={`
                                    ${$article.nav}
                                    ${props.kind == "equal" && $article.nav$$equal}
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