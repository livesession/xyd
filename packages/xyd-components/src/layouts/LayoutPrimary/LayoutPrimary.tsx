import * as React from 'react'
import { useEffect, useState } from "react"

import * as cn from "./LayoutPrimary.styles"

export interface LayoutPrimaryProps {
    header: React.ReactNode;
    aside: React.ReactNode;
    content: React.ReactNode;
    contentNav?: React.ReactNode;
    subheader?: React.ReactNode;

    layoutSize?: "large"

    className?: string;
}

// TODO: move scroller to xyd-foo
export function LayoutPrimary(props: LayoutPrimaryProps) {
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

    const { hideMainHeader } = props.subheader ? useSubHeader() : { hideMainHeader: false }

    return <xyd-layout-primary
        className={`${cn.LayoutPrimaryHost} ${props.className || ""}`}
    >
        <header
            data-part="header"
            data-subheader={!!props.subheader}
            data-hidden={hideMainHeader}
        >
            <div data-part="header-content">
                {props.header}
                <button
                    data-part="hamburger-button"
                    aria-label="Toggle navigation menu"
                    onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                >
                    <div data-part="hamburger-icon">
                        <$HamburgerLine active={isMobileNavOpen} />
                        <$HamburgerLine active={isMobileNavOpen} />
                        <$HamburgerLine active={isMobileNavOpen} />
                    </div>
                </button>
            </div>
            {props.subheader}
        </header>

        {/* Mobile Drawer Sidebar */}
        <div
            data-part="mobile-overlay"
            data-active={isMobileNavOpen}
            onClick={() => setIsMobileNavOpen(false)}
        />
        <aside
            data-part="mobile-sidebar"
            data-active={isMobileNavOpen}
        >
            <div data-part="mobile-sidebar-aside">
                {props.aside}
            </div>
            <button
                data-part="mobile-sidebar-close-button"
                aria-label="Close navigation menu"
                onClick={() => setIsMobileNavOpen(false)}
            >
                <div data-part="mobile-sidebar-close-icon" />
            </button>
        </aside>

        <main data-part="main">
            {/* Desktop Static Sidebar */}
            <aside data-part="sidebar">
                {props.aside}
            </aside>

            <div data-part="page">
                <div data-part="page-scroll">
                    <div
                        data-part="page-container"
                        data-size={props.layoutSize}
                    >
                        <div data-part="page-article-container">
                            <article data-part="page-article">
                                <section data-part="page-article-content">
                                    {props.content}
                                </section>
                            </article>
                            {props.contentNav && <nav data-part="page-article-nav">
                                {props.contentNav}
                            </nav>}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </xyd-layout-primary>
}

function $HamburgerLine({ active }: { active: boolean }) {
    return <span
        data-part="hamburger-line"
        data-active={active}
    />
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
        document.querySelector(`.${cn.LayoutPrimaryPageScroll}`)?.addEventListener("scroll", onScroll)
        document.querySelector(`.${cn.LayoutPrimaryPageScroll}`)?.addEventListener("scrollend", onScrollFinish)

        return () => {
            document.querySelector(`.${cn.LayoutPrimaryPageScroll}`)?.removeEventListener("scroll", onScroll)
            document.querySelector(`.${cn.LayoutPrimaryPageScroll}`)?.removeEventListener("scrollend", onScrollFinish)
        }
    }, []);

    return {
        hideMainHeader,
    }
}