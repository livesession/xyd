import React, { useState, useRef, useEffect } from 'react'
import { Tabs as RadixTabs } from "radix-ui"; // TODO: remove and use separation
import { ChevronLeft, ChevronRight } from "lucide-react"

import * as cn from "./TabsSecondary.styles";
import { useValueChange } from './useValueChange';
import { useTabsAnalytics } from './TabsAnalytics';

export interface TabsSecondaryProps {
    /** The currently selected tab value */
    value?: string
    children: React.ReactNode;
    className?: string;
    onChange?: (value: string) => void
}

export function TabsSecondary({ children, value: controlledValue, onChange, className }: TabsSecondaryProps) {
    const tabsAnalytics = useTabsAnalytics()
    const [showLeftArrow, setShowLeftArrow] = useState(false)
    const [showRightArrow, setShowRightArrow] = useState(false)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const childrenArray = React.Children.toArray(children);
    const navItems = childrenArray.filter(
        child => {
            return React.isValidElement(child) &&
                (child.type === TabsSecondary.Item ||
                    (typeof child.type === 'function' && 'displayName' in child.type && child.type.displayName === "Tabs.Item"))
        }
    );
    const otherChildren = childrenArray.filter(
        child => !React.isValidElement(child) ||
            (child.type !== TabsSecondary.Item &&
                !(typeof child.type === 'function' && 'displayName' in child.type && child.type.displayName === "Tabs.Item"))
    );

    const [_, value, handleValueChange] = useValueChange(
        controlledValue,
        onChange,
        navItems,
    );

    useEffect(() => {
        tabsAnalytics.setValue(value)
    }, [value])

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
            setShowLeftArrow(scrollLeft > 0)
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth)
        }
    }

    useEffect(() => {
        handleScroll()
        window.addEventListener('resize', handleScroll)
        return () => window.removeEventListener('resize', handleScroll)
    }, [])

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = direction === 'left' ? -200 : 200
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
        }
    }

    return (
        <RadixTabs.Root asChild value={value} onValueChange={handleValueChange}>
            <xyd-tabs
                ref={tabsAnalytics.tabsRef}
                data-kind="secondary"
                className={`${cn.TabsSecondaryHost} ${className || ""}`}
            >
                <div part="buttons">
                    {showLeftArrow && (
                        <button
                            onClick={() => scroll('left')}
                            part="arrow"
                        >
                            <ChevronLeft part="arrow-icon" />
                        </button>
                    )}

                    <div
                        ref={scrollContainerRef}
                        onScroll={handleScroll}
                        part="scroller"
                    >
                        <div
                            part="scroller-container"
                        >
                            <RadixTabs.List>
                                {navItems}
                            </RadixTabs.List>
                        </div>
                    </div>

                    {showRightArrow && (
                        <button
                            onClick={() => scroll('right')}
                            part="arrow"
                        >
                            <ChevronRight part="arrow-icon" />
                        </button>
                    )}
                </div>
                <div part="content">
                    {otherChildren}
                </div>
            </xyd-tabs>
        </RadixTabs.Root>
    );
}

/**
 * Props for the TabsPrimary.Item component
 */
export interface TabsSecondaryItemProps {
    /** Child elements to be rendered within the navigation item */
    children: React.ReactNode

    /** Unique identifier for the navigation item */
    value: string

    /** URL for the navigation item link */
    href?: string

    /** Custom component to render as the link element */
    as?: React.ElementType

    /** Whether this item should be active by default */
    defaultActive?: boolean
}

TabsSecondary.Item = function TabsPrimaryItem({ children, value, href, as, defaultActive }: TabsSecondaryItemProps) {
    const Link = as || _Link;
    const controlByItem = typeof defaultActive === "boolean"
    const [defaultActiveState, setDefaultActiveState] = useState(controlByItem ? (defaultActive ? "active" : "inactive") : undefined)

    let activeProps = controlByItem && defaultActiveState != undefined
        ? { "data-state": defaultActiveState }
        : undefined

    useEffect(() => {
        if (!controlByItem) {
            return
        }

        setDefaultActiveState(undefined)
    }, [])

    return (
        <RadixTabs.Trigger className={cn.TabsSecondaryItem} value={value} asChild {...activeProps}>
            <div>
                <Link href={href}>
                    {children}
                </Link>
            </div>
        </RadixTabs.Trigger>
    );
}

function _Link({ ...props }) {
    return <a {...props}>{props.children}</a>
}


TabsSecondary.Content = function TabsContent({ children, value }) {
    return <RadixTabs.Content asChild value={value}>
        <div>
            {children}
        </div>
    </RadixTabs.Content>
}

