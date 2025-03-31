import React, {useEffect, useState} from "react"

import * as cn from "./Layout.styles"

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
    const [scrollTop, setScrollTop] = useState(0)
    const [controlScrollPos, setControlScrollPos] = useState(0)

    useEffect(() => {
        if (scrollTop === controlScrollPos) {
            return
        }

        const checkpoint = parseInt(cn.globalHeaderHeight, 10) / 2
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

        document.querySelector(`.${cn.PageScroll}`)?.addEventListener("scroll", onScroll)
        document.querySelector(`.${cn.PageScroll}`)?.addEventListener("scrollend", onScrollFinish)

        return () => {
            document.querySelector(`.${cn.PageScroll}`)?.removeEventListener("scroll", onScroll)
            document.querySelector(`.${cn.PageScroll}`)?.removeEventListener("scrollend", onScrollFinish)
        }
    }, []);

    return <div className={cn.LayoutHost}>
        <Layout.Header className={`
            ${props.subheader && cn.LayoutHeaderSub}
            ${hideMainHeader && cn.LayoutHeaderHideMain}
        `}>
            {props.header}
        </Layout.Header>
        <main className={`
            ${cn.LayoutMain}
            ${!hideMainHeader && props.subheader && cn.LayoutMainSub}
        `}>
            <aside className={cn.LayoutSidebar}>
                {props.aside}
            </aside>
            <div className={cn.PageHost}>
                <div className={cn.PageScroll}>
                    <div className={cn.PageContainer}>
                        <div className={`
                            ${cn.PageArticleContainer}
                            ${props.kind == "fullwidth" && cn.PageArticleContainerFullWidth}
                        `}>
                            <article className={cn.ArticleHost}>
                                <section className={cn.ArticleContent}>
                                    {props.content}
                                </section>
                                {
                                    props.contentNav && <nav className={cn.ArticleNav}>
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

Layout.Header = function LayoutHeader({className, children}: { className?: string, children: React.ReactNode }) {
    return <header className={`
            ${cn.LayoutHeader}
            ${className}
        `}>
        {children}
    </header>
}
