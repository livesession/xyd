import * as React from 'react'
import { useContext, useEffect, useRef, useState } from "react"

import { PageLayout } from '@xyd-js/core';

import * as cn from "./LayoutPrimary.styles"

export interface LayoutPrimaryProps {
    children: React.ReactNode;

    subheader?: boolean;
    className?: string;
    layout?: PageLayout
    scrollKey?: string
}

const LayoutPrimaryContext = React.createContext<{
    scrollRef: React.RefObject<HTMLDivElement | null>;
    isMobileNavOpen: boolean;
    setIsMobileNavOpen: (isOpen: boolean) => void;
}>({
    scrollRef: React.createRef(),
    isMobileNavOpen: false,
    setIsMobileNavOpen: () => { },
})

// TODO: move scroller to xyd-foo
export function LayoutPrimary(props: LayoutPrimaryProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
    const { hideMainHeader } = useSubHeader(props.subheader ? scrollRef : null, props.scrollKey)

    return <LayoutPrimaryContext value={{
        scrollRef,
        isMobileNavOpen,
        setIsMobileNavOpen
    }}
    >
        <xyd-layout-primary
            className={`${cn.LayoutPrimaryHost} ${props.className || ""}`}
            data-subheader={String(!!props.subheader)}
            data-hide-subheader={String(hideMainHeader)}
            data-layout={props.layout}
        >
            {props.children}
        </xyd-layout-primary>
    </LayoutPrimaryContext>
}

interface LayoutPrimaryHeaderProps {
    header: React.ReactNode;

    subheader?: React.ReactNode;
}
LayoutPrimary.Header = function LayoutPrimaryHeader(props: LayoutPrimaryHeaderProps) {
    const { isMobileNavOpen, setIsMobileNavOpen } = useContext(LayoutPrimaryContext)

    return <>
        <header part="header">
            <div part="header-content">
                {props.header}
                <button
                    part="hamburger-button"
                    aria-label="Toggle navigation menu"
                    onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                >
                    <div part="hamburger-icon">
                        <$HamburgerLine active={isMobileNavOpen} />
                        <$HamburgerLine active={isMobileNavOpen} />
                        <$HamburgerLine active={isMobileNavOpen} />
                    </div>
                </button>
            </div>

            {props.subheader}
        </header>
    </>
}

interface LayoutPrimaryMobileAsideProps {
    aside: React.ReactNode;
}
LayoutPrimary.MobileAside = function LayoutPrimaryAside(props: LayoutPrimaryMobileAsideProps) {
    const { isMobileNavOpen, setIsMobileNavOpen } = useContext(LayoutPrimaryContext)
    return <>
        <div
            part="mobile-overlay"
            data-active={isMobileNavOpen}
            onClick={() => setIsMobileNavOpen(false)}
        />
        <aside
            part="mobile-sidebar"
            data-active={isMobileNavOpen}
        >
            <div part="mobile-sidebar-aside">
                {props.aside}
            </div>
            <button
                part="mobile-sidebar-close-button"
                aria-label="Close navigation menu"
                onClick={() => setIsMobileNavOpen(false)}
            >
                <div part="mobile-sidebar-close-icon" />
            </button>
        </aside>
    </>
}

interface LayoutPrimaryPageProps {
    children: React.ReactNode;
    contentNav?: React.ReactNode;
}
LayoutPrimary.Page = function LayoutPrimaryPage(props: LayoutPrimaryPageProps) {
    const { scrollRef } = useContext(LayoutPrimaryContext)

    return <>
        <div part="page">
            <div part="page-scroll" ref={scrollRef}>
                <div part="page-container">
                    <div part="page-article-container">

                        <article part="page-article">
                            <section part="page-article-content">
                                {props.children}
                            </section>
                        </article>

                        {
                            props.contentNav && <nav part="page-article-nav">
                                {props.contentNav}
                            </nav>
                        }
                    </div>
                </div>
            </div>
        </div>
    </>
}

function $HamburgerLine({ active }: { active: boolean }) {
    return <span
        part="hamburger-line"
        data-active={active}
    />
}

// TODO: move to `xyd-foo` or somewhere else
// TODO  better solution than `key`
function useSubHeader(ref: React.RefObject<HTMLDivElement | null> | null, key?: any) {
    const [hideMainHeader, setHideMainHeader] = useState(false)
    const [scrollTop, setScrollTop] = useState(0)
    const [controlScrollPos, setControlScrollPos] = useState(0)
    const [lastScrollDirection, setLastScrollDirection] = useState<'up' | 'down' | null>(null)

    function reset() {
        setHideMainHeader(false)
        setScrollTop(0)
        setControlScrollPos(0)
    }

    useEffect(() => {
        reset()
    }, [key])

    useEffect(() => {
        if (scrollTop === controlScrollPos) {
            return
        }

        // Get the header height from CSS variable
        const headerHeight = parseInt(
            getComputedStyle(document.documentElement)
                .getPropertyValue('--xyd-nav-height')
                .trim() || '0',
            10
        );
        const checkpoint = headerHeight / 2;
        const diff = scrollTop - controlScrollPos
        const reversePosDiff = Math.abs(scrollTop - controlScrollPos)

        // Determine scroll direction
        const direction = diff > 0 ? 'down' : 'up'
        setLastScrollDirection(direction)

        // Always show header when near the top of the page
        if (scrollTop < headerHeight) {
            setHideMainHeader(false)
            return
        }

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

    useEffect(() => {
        if (!ref?.current) {
            return
        }

        ref.current.addEventListener("scroll", onScroll)
        ref.current.addEventListener("scrollend", onScrollFinish)

        return () => {
            ref.current?.removeEventListener("scroll", onScroll)
            ref.current?.removeEventListener("scrollend", onScrollFinish)
        }
    }, [ref, key]);

    return {
        hideMainHeader,
    }
}