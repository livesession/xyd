import React, {useState, useRef, useEffect} from 'react'
import {Tabs as RadixTabs} from "radix-ui"; // TODO: remove and use separation
import {ChevronLeft, ChevronRight} from "lucide-react"

import * as cn from "./TabsSecondary.styles";
import {useValueChange} from './useValueChange';

export interface TabsProps {
    /** The currently selected tab value */
    value?: string
    children: React.ReactNode;
    className?: string;
    onChange?: (value: string) => void
}

export function TabsSecondary({children, value: controlledValue, onChange, className}: TabsProps) {
    const [showLeftArrow, setShowLeftArrow] = useState(false)
    const [showRightArrow, setShowRightArrow] = useState(false)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const childrenArray = React.Children.toArray(children);
    const navItems = childrenArray.filter(
        child => {
            return React.isValidElement(child) &&
                (child.type === TabsSecondary.Item ||
                    (typeof child.type === 'function' && 'displayName' in child.type && child.type.displayName === "TabsSecondary.Item"))
        }
    );
    const otherChildren = childrenArray.filter(
        child => !React.isValidElement(child) ||
            (child.type !== TabsSecondary.Item &&
                !(typeof child.type === 'function' && 'displayName' in child.type && child.type.displayName === "TabsSecondary.Item"))
    );

    const [_, value, handleValueChange] = useValueChange(
        controlledValue,
        onChange,
        navItems
    );

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const {scrollLeft, scrollWidth, clientWidth} = scrollContainerRef.current
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
            scrollContainerRef.current.scrollBy({left: scrollAmount, behavior: 'smooth'})
        }
    }

    return (
        <RadixTabs.Root asChild value={value} onValueChange={handleValueChange}>
            <xyd-tabs
                data-kind="secondary"
                className={`${cn.TabsSecondaryHost} ${className || ""}`}
            >
                <div part="buttons">
                    {showLeftArrow && (
                        <button
                            onClick={() => scroll('left')}
                            part="arrow"
                        >
                            <ChevronLeft part="arrow-icon"/>
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
                            <ChevronRight part="arrow-icon"/>
                        </button>
                    )}
                </div>

                <div part="content">
                    {otherChildren}
                </div>
            </xyd-tabs>
        </RadixTabs.Root>
    )
}

TabsSecondary.Item = function TabsContent({children, value}) {
    return <RadixTabs.Trigger asChild value={value}>
        <button part="button">
            {children}
        </button>
    </RadixTabs.Trigger>
}

TabsSecondary.Content = function TabsContent({children, value}) {
    return <RadixTabs.Content asChild value={value}>
        <div>
            {children}
        </div>
    </RadixTabs.Content>
}

