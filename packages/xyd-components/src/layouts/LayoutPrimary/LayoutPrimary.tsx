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
    scrollRef: React.RefObject<HTMLDivElement | Window | null>;
    isMobileNavOpen: boolean;
    setIsMobileNavOpen: (isOpen: boolean) => void;
}>({
    scrollRef: React.createRef(),
    isMobileNavOpen: false,
    setIsMobileNavOpen: () => { },
})

// TODO: move scroller to xyd-foo
export function LayoutPrimary(props: LayoutPrimaryProps) {
    const scrollRef = useRef<HTMLDivElement | Window>(null)
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
    const { hideMainHeader } = useSubHeader(props.subheader ? scrollRef : null, props.scrollKey)

    useEffect(() => {
        scrollRef.current = window
    }, [])

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
            </div>

            {props.subheader}
        </header>
    </>
}

LayoutPrimary.Hamburger = function LayoutPrimaryHamburger() {
    const { isMobileNavOpen, setIsMobileNavOpen } = useContext(LayoutPrimaryContext)
    return <button
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
    return <>
        <div part="page">
            <div part="page-scroll">
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

const SCROLL_DOWN_TRIGGER_THRESHOLD = 200;
const SCROLL_UP_TRIGGER_THRESHOLD = 100;

// TODO: move to `xyd-foo` or somewhere else
// TODO  better solution than `key`
function useSubHeader(ref: React.RefObject<HTMLDivElement | Window | null> | null, key?: any) {
    const [hideMainHeader, setHideMainHeader] = useState(false)
    const [lastScrollTop, setLastScrollTop] = useState(0)
    const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null)
    const [scrollThreshold, setScrollThreshold] = useState(0)
    const [scrollStartPosition, setScrollStartPosition] = useState(0)
    const [isScrolling, setIsScrolling] = useState(false)

    function reset() {
        setHideMainHeader(false)
        setLastScrollTop(0)
        setScrollDirection(null)
        setScrollThreshold(0)
        setScrollStartPosition(0)
        setIsScrolling(false)
    }

    useEffect(() => {
        reset()
    }, [key])

    function onScroll(e: Event) {
        if (!(e.target instanceof HTMLElement)) {
            return
        }

        const currentScrollTop = e.target.scrollTop

        // Always show header when near the top of the page
        if (currentScrollTop < SCROLL_UP_TRIGGER_THRESHOLD) {
            setHideMainHeader(false)
            setScrollThreshold(0)
            setLastScrollTop(currentScrollTop)
            setIsScrolling(false)
            return
        }

        // Determine scroll direction
        const direction = currentScrollTop > lastScrollTop ? 'down' : 'up'

        // If direction changed, reset scroll tracking
        if (direction !== scrollDirection) {
            setScrollDirection(direction)
            setScrollStartPosition(currentScrollTop)
            setIsScrolling(true)
        }

        // Calculate total scroll distance from start position
        const totalScrollDistance = Math.abs(currentScrollTop - scrollStartPosition)

        // Only trigger header changes if we've scrolled enough distance in the current direction
        if (direction === 'down' && totalScrollDistance > SCROLL_DOWN_TRIGGER_THRESHOLD) {
            // When scrolling down, hide header
            setHideMainHeader(true)
            setScrollThreshold(currentScrollTop)
            // Reset scroll tracking after triggering
            setScrollStartPosition(currentScrollTop)
        } else if (direction === 'up' && totalScrollDistance > SCROLL_UP_TRIGGER_THRESHOLD) {
            // When scrolling up, show header
            setHideMainHeader(false)
            setScrollThreshold(currentScrollTop)
            // Reset scroll tracking after triggering
            setScrollStartPosition(currentScrollTop)
        }

        setLastScrollTop(currentScrollTop)
    }

    useEffect(() => {
        if (!ref?.current) {
            return
        }

        ref.current.addEventListener("scroll", onScroll)

        return () => {
            ref.current?.removeEventListener("scroll", onScroll)
        }
    }, [ref, key, lastScrollTop, scrollDirection, scrollThreshold, scrollStartPosition]);

    return {
        hideMainHeader,
    }
}