import React, {useEffect, useState} from "react"

import {$layout, $page, $article, globalHeaderHeight} from "./LayoutPrimary.styles.tsx"

export interface LayoutPrimaryProps {
    header: React.ReactNode;
    aside: React.ReactNode;
    content: React.ReactNode;
    contentNav: React.ReactNode;

    subheader?: React.ReactNode;
    layoutSize?: "large"
}

// TODO: move scroller to xyd-foo
export function LayoutPrimary(props: LayoutPrimaryProps) {
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

    const {hideMainHeader} = props.subheader ? useSubHeader() : {hideMainHeader: false}

    return <div className={$layout.host}>
        <header className={` 
            ${$layout.header}
            ${props.subheader && $layout.header$$sub}
            ${hideMainHeader && $layout.header$$hideMain}
        `}>
            <div className={$layout.primaryHeaderContent}>
                {props.header}
                <button
                    className={$layout.hamburgerButton}
                    onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                    aria-label="Toggle navigation menu"
                >
                    <div className={$layout.hamburgerIcon}>
                        <span className={`${$layout.hamburgerLine} ${isMobileNavOpen ? $layout.hamburgerLine$$open : ''}`}/>
                        <span className={`${$layout.hamburgerLine} ${isMobileNavOpen ? $layout.hamburgerLine$$open : ''}`}/>
                        <span className={`${$layout.hamburgerLine} ${isMobileNavOpen ? $layout.hamburgerLine$$open : ''}`}/>
                    </div>
                </button>
            </div>
            {props.subheader}
        </header>

        {/* Mobile Drawer Sidebar */}
        <div
            className={`${$layout.overlay} ${isMobileNavOpen ? $layout.overlay$$visible : ''}`}
            onClick={() => setIsMobileNavOpen(false)}
        />
        <aside className={`
            ${$layout.mobileSidebar}
            ${isMobileNavOpen ? $layout.mobileSidebar$$open : ''}
        `}>
            <div className={$layout.sidebarContent}>
                {props.aside}
            </div>
            <button
                className={$layout.closeButton}
                onClick={() => setIsMobileNavOpen(false)}
                aria-label="Close navigation menu"
            >
                <div className={$layout.closeIcon}/>
            </button>
        </aside>

        <main className={`
            ${$layout.main}
            ${!hideMainHeader && props.subheader && $layout.main$$sub}
        `}>
            {/* Desktop Static Sidebar */}
            <aside className={$layout.staticSidebar}>
                {props.aside}
            </aside>

            <div className={$page.host}>
                <div className={$page.scroll}>
                    <div className={`
                        ${$page.container}
                        ${props.layoutSize == "large" && $page.container$$large}
                    `}>
                        <div className={`
                            ${$page.articleContainer}
                        `}>
                            <article className={$article.host}>
                                <section className={$article.content}>
                                    {props.content}
                                </section>
                                {
                                    props.contentNav && <nav className={`
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

// TODO: move to `xyd-foo` or somewhere else
function useSubHeader() {
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
        document.querySelector(`.${$page.scroll}`)?.addEventListener("scroll", onScroll)
        document.querySelector(`.${$page.scroll}`)?.addEventListener("scrollend", onScrollFinish)

        return () => {
            document.querySelector(`.${$page.scroll}`)?.removeEventListener("scroll", onScroll)
            document.querySelector(`.${$page.scroll}`)?.removeEventListener("scrollend", onScrollFinish)
        }
    }, []);

    return {
        hideMainHeader,
    }
}