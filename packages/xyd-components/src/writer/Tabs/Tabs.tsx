import React, { useState, useRef, useEffect } from 'react'
import * as RadixTabs from "@radix-ui/react-tabs"
import { ChevronLeft, ChevronRight } from "lucide-react"

import * as cn from "./Tabs.styles";

export interface TabsProps {
    children: React.ReactNode;
    items: string[];
    tabIndex?: number;
    className?: string;
}

export function Tabs({ children, items, tabIndex, className }: TabsProps) {
    const [showLeftArrow, setShowLeftArrow] = useState(false)
    const [showRightArrow, setShowRightArrow] = useState(false)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const [value, setActiveTab] = useState(items[tabIndex || 0] || "")

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
        <RadixTabs.Root asChild value={value} onValueChange={setActiveTab}>
            <div
                data-element="xyd-tabs"
                className={`${cn.TabsSampleHost} ${className || ""}`}
            >
                <div data-part="buttons">
                    {showLeftArrow && (
                        <button
                            onClick={() => scroll('left')}
                            data-part="arrow"
                        >
                            <ChevronLeft data-part="arrow-icon" />
                        </button>
                    )}

                    <div
                        ref={scrollContainerRef}
                        onScroll={handleScroll}
                        data-part="scroller"
                    >
                        <div
                            data-part="scroller-container"
                        >
                            <RadixTabs.List>
                                {items.map((item, index) => <$TabsItem key={index} value={item}>
                                    {item}
                                </$TabsItem>
                                )}
                            </RadixTabs.List>
                        </div>
                    </div>

                    {showRightArrow && (
                        <button
                            onClick={() => scroll('right')}
                            data-part="arrow"
                        >
                            <ChevronRight data-part="arrow-icon" />
                        </button>
                    )}
                </div>

                <div data-part="content">
                    {children}
                </div>
            </div>
        </RadixTabs.Root>
    )
}

function $TabsItem({ children, value }) {
    return <RadixTabs.Trigger asChild value={value}>
        <button data-part="button">
            {children}
        </button>
    </RadixTabs.Trigger>
}

Tabs.Content = function TabsContent({ children, value }) {
    return <RadixTabs.Content asChild value={value}>
        {children}
    </RadixTabs.Content>
}