import React, { useEffect, useRef } from "react"
import { Link, useLocation } from "react-router"

import { UICollapse } from "./Collapse";

import * as cn from "./Sidebar.styles";

export interface UISidebarProps {
    children: React.ReactNode;
    footerItems?: React.ReactNode;
    /** Pinned content rendered ABOVE the scrollable item list (stays visible on scroll). */
    fixedTop?: React.ReactNode;
    className?: string;
    scrollShadow?: boolean;
    scrollTransition?: "smooth" | "instant";
    groupCase?: "none" | "uppercase";
    /**
     * Which element scrolls. `"list"` (default): only the item list scrolls, below
     * the fixed region. `"sidebar"`: the WHOLE sidebar scrolls (the scrollbar spans
     * its full height) and the fixed region sticks to the top.
     */
    scroll?: "list" | "sidebar";
}

export function UISidebar({ children, footerItems, fixedTop, className, scrollShadow, scrollTransition = 'instant', groupCase, scroll = "list" }: UISidebarProps) {
    const listRef = useRef<HTMLUListElement>(null);
    const hostRef = useRef<HTMLElement>(null);

    // Active-item centering must target the element that actually scrolls.
    useSidebarScrollTransition(scroll === "sidebar" ? hostRef : listRef, scrollTransition);

    // TODO: in the future theming api?
    return <xyd-sidebar
        ref={hostRef}
        className={`${cn.SidebarHost} ${className || ""}`}
        data-group-case={groupCase}
        data-scroll={scroll === "sidebar" ? "sidebar" : undefined}
    >
        {scrollShadow && <div part="scroll-shadow" />}

        {fixedTop && <div part="fixed">{fixedTop}</div>}

        <ul part="list" ref={listRef}>
            {children}
        </ul>

        {
            footerItems && <div part="footer">
                <ul>
                    {footerItems}
                </ul>
            </div>
        }
    </xyd-sidebar>
}

export interface UISidebarItemProps {
    children: React.ReactNode;
    button?: boolean;
    href?: string;
    active?: boolean;
    activeTheme?: "secondary";
    isParentActive?: boolean;
    ghost?: boolean;
    icon?: React.ReactNode;
    group?: false;
    onClick?: (v: any) => void
}

UISidebar.ItemGroup = function SidebarItemGroup({ children, asToc }: { children: React.ReactNode, asToc?: boolean }) {
    return <div part="item-group" data-astoc={asToc ? "true" : undefined}>
        {children}
    </div>
}

UISidebar.Item = function SidebarItem({
    children,
    button,
    href,
    active,
    activeTheme,
    isParentActive,
    ghost,
    icon,
    group,
    onClick,
}: UISidebarItemProps) {
    const [firstChild, ...restChilds] = React.Children.toArray(children)

    const ButtonOrAnchor = ghost ? "div" : button ? 'button' : Link

    let h = href?.endsWith("/") ? href.slice(0, -1) : href

    let target = ""
    if (href?.startsWith("http://") || href?.startsWith("https://")) {
        target = "_blank"
    }

    return <li
        part="item"
        className={cn.ItemHost}
        data-theme={activeTheme}
        data-ghost={ghost ? String(ghost) : undefined}
    >
        {
            group !== false && <ButtonOrAnchor
                part={`item-${button ? "button" : "link"}`}
                {...(ghost ? {} : {
                    ...(button ? {} : { href: h }),
                    ...(h ? { to: h } : {}),
                    ...(target ? { target } : {})
                })}
                onClick={onClick}
                prefetch="intent"
            >
                <div
                    part="primary-item"
                    data-parent-active={isParentActive}
                    data-active={active}
                    data-ghost={ghost ? String(ghost) : undefined}
                >
                    <>
                        {icon}

                        {firstChild}
                    </>
                </div>
            </ButtonOrAnchor>
        }

        {restChilds}
    </li>
}

export interface UISidebarItemHeaderProps {
    children: React.ReactNode;
    icon?: React.ReactNode;
}

UISidebar.ItemHeader = function SidebarItemHeader({ children, icon }: UISidebarItemHeaderProps) {
    return <li part="item-header" className={cn.ItemHeaderHost}>
        {icon}
        {children}
    </li>
}


export interface UISidebarItemBody {
    title: React.ReactNode;
    right?: React.ReactNode;
}

UISidebar.ItemBody = function SidebarItemBody({ title, right }: UISidebarItemBody) {
    return <div part="item-title-container">

        <div part="item-title">
            {title}
        </div>

        {right}
    </div>
}


export interface UISidebarSubTreeProps {
    children: React.ReactNode;
    isOpen?: boolean;
}

UISidebar.SubTree = function SidebarSubItem({ children, isOpen }: UISidebarSubTreeProps) {
    return <ul part="subtree" className={cn.TreeHost}>
        <UICollapse isOpen={isOpen || false}>
            {children}
        </UICollapse>
    </ul>
}

// TODO: move to shared code
function useSidebarScrollTransition(
    listRef: React.RefObject<HTMLElement | null>,
    scrollTransition: "smooth" | "instant" | "auto" = 'auto'
) {
    const location = useLocation();
    const isFirstLoad = useRef(true);

    const scrollToActiveElement = (delay: number, logPrefix: string, behavior: ScrollBehavior = 'instant', forceScroll: boolean = false) => {
        const timeoutId = setTimeout(() => {
            if (listRef.current) {
                const activeElement = listRef.current.querySelector('[data-active="true"]');
                if (activeElement) {
                    const container = listRef.current;
                    const containerRect = container.getBoundingClientRect();
                    const elementRect = activeElement.getBoundingClientRect();
                    
                    // Check if the active element is visible in the container
                    const isElementVisible = (
                        elementRect.top >= containerRect.top &&
                        elementRect.bottom <= containerRect.bottom
                    );
                    
                    // Scroll if element is not visible OR if forceScroll is true (for first load)
                    if (!isElementVisible || forceScroll) {
                        const containerHeight = container.clientHeight;
                        const elementTop = elementRect.top - containerRect.top;
                        const elementHeight = activeElement.clientHeight;
                        const scrollTop = container.scrollTop;

                        // Calculate the position to center the element
                        const targetScroll = scrollTop + elementTop - (containerHeight / 2) + (elementHeight / 2);

                        // const reason = forceScroll ? 'first load' : 'element not visible';
                        // console.log(`🔄 Sidebar ${logPrefix} scrollTo (${reason})`, targetScroll, activeElement);
                        container.scrollTo({
                            top: targetScroll,
                            behavior
                        });
                    } else {
                        // console.log(`🔄 Sidebar ${logPrefix} - element already visible, skipping scroll`, activeElement);
                    }
                }
            }
        }, delay);

        return timeoutId;
    };

    useEffect(() => {
        if (isFirstLoad.current) {
            // Skip navigation changes on first load
            isFirstLoad.current = false;
            return;
        }

        const timeoutId = scrollToActiveElement(50, 'useEffect', scrollTransition as ScrollBehavior, false);
        return () => clearTimeout(timeoutId);
    }, [location.pathname, scrollTransition]);

    // Only scroll to active element on initial load
    useEffect(() => {
        const timeoutId = scrollToActiveElement(100, 'initial load', 'instant', true); // Always scroll on first load
        return () => clearTimeout(timeoutId);
    }, []); // Empty dependency array for initial load only
}