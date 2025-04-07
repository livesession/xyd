import React, {useEffect, useState} from "react"

import * as cn from "./LayoutPrimary.styles"

export interface LayoutPrimaryProps {
    header: React.ReactNode;
    aside: React.ReactNode;
    content: React.ReactNode;
    contentNav?: React.ReactNode;

    subheader?: React.ReactNode;
    layoutSize?: "large"
}

// TODO: move scroller to xyd-foo
export function LayoutPrimary(props: LayoutPrimaryProps) {
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

    const {hideMainHeader} = props.subheader ? useSubHeader() : {hideMainHeader: false}

    return <div className={cn.LayoutPrimaryHost}>
        <header className={` 
            ${cn.LayoutPrimaryHeader}
            ${props.subheader && cn.LayoutPrimaryHeaderSub}
            ${hideMainHeader && cn.LayoutPrimaryHeaderHideMain}
        `}>
            <div className={cn.LayoutPrimaryHeaderContent}>
                {props.header}
                <button
                    className={cn.LayoutPrimaryHamburgerButton}
                    onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                    aria-label="Toggle navigation menu"
                >
                    <div className={cn.LayoutPrimaryHamburgerIcon}>
                        <span
                            className={`${cn.LayoutPrimaryHamburgerLine} ${isMobileNavOpen ? cn.LayoutPrimaryHamburgerLineOpen : ''}`}/>
                        <span
                            className={`${cn.LayoutPrimaryHamburgerLine} ${isMobileNavOpen ? cn.LayoutPrimaryHamburgerLineOpen : ''}`}/>
                        <span
                            className={`${cn.LayoutPrimaryHamburgerLine} ${isMobileNavOpen ? cn.LayoutPrimaryHamburgerLineOpen : ''}`}/>
                    </div>
                </button>
            </div>
            {props.subheader}
        </header>

        {/* Mobile Drawer Sidebar */}
        <div
            className={`${cn.LayoutPrimaryOverlay} ${isMobileNavOpen ? cn.LayoutPrimaryOverlayVisible : ''}`}
            onClick={() => setIsMobileNavOpen(false)}
        />
        <aside className={`
            ${cn.LayoutPrimaryMobileSidebar}
            ${isMobileNavOpen ? cn.LayoutPrimaryMobileSidebarOpen : ''}
        `}>
            <div className={cn.LayoutPrimarySidebarContent}>
                {props.aside}
            </div>
            <button
                className={cn.LayoutPrimaryCloseButton}
                onClick={() => setIsMobileNavOpen(false)}
                aria-label="Close navigation menu"
            >
                <div className={cn.LayoutPrimaryCloseIcon}/>
            </button>
        </aside>

        <main className={`
            ${cn.LayoutPrimaryMain}
            ${!hideMainHeader && props.subheader && cn.LayoutPrimaryMainSub}
        `}>
            {/* Desktop Static Sidebar */}
            <aside className={cn.LayoutPrimaryStaticSidebar}>
                {props.aside}
            </aside>

            <div className={cn.LayoutPrimaryPageHost}>
                <div className={cn.LayoutPrimaryPageScroll}>
                    <div className={`
                        ${cn.LayoutPrimaryPageContainer}
                        ${props.layoutSize == "large" && cn.LayoutPrimaryPageContainerLarge}
                    `}>
                        <div className={cn.LayoutPrimaryPageArticleContainer}>
                            <article className={cn.LayoutPrimaryArticleHost}>
                                <section className={cn.LayoutPrimaryArticleContent}>
                                    {props.content}
                                </section>
                            </article>
                            {props.contentNav && <nav className={cn.LayoutPrimaryArticleNav}>
                                {props.contentNav}
                            </nav>}
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