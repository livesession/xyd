import React, {useState, useRef, useEffect} from 'react'
import {ChevronLeft, ChevronRight} from "lucide-react"

import {Example} from "@xyd-js/uniform";

import {MDXReference, mdxValue} from "@/utils/mdx";

import {
    $sample,
    $arrow,
    $scroller,
    $button
} from "./CodeSampleButtons.styles";

export interface CodeExampleButtonsProps {
    examples: MDXReference<Example[]>

    activeExample: MDXReference<Example> | null

    onClick: (example: MDXReference<Example>) => void
}

export function CodeExampleButtons({examples, activeExample, onClick}: CodeExampleButtonsProps) {
    const [showLeftArrow, setShowLeftArrow] = useState(false)
    const [showRightArrow, setShowRightArrow] = useState(false)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

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
        <div className={$sample.host}>
            <div className={$sample.container}>
                {showLeftArrow && (
                    <button
                        onClick={() => scroll('left')}
                        className={$arrow.host}
                    >
                        <ChevronLeft className={$arrow.icon}/>
                    </button>
                )}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className={$scroller.host}
                >
                    <div className={$scroller.container}>
                        {examples.map((example) => (
                            <$SampleButton
                                key={example.codeblock.title}
                                onClick={() => onClick(example)}
                                example={example}
                                activeExample={activeExample}
                            >
                                {mdxValue(example.codeblock.title || null)}
                            </$SampleButton>
                        ))}
                    </div>
                </div>
                {showRightArrow && (
                    <button
                        onClick={() => scroll('right')}
                        className={$arrow.host}
                    >
                        <ChevronRight className={$arrow.icon}/>
                    </button>
                )}
            </div>
        </div>
    )
}

function $SampleButton({onClick, children, activeExample, example}: {
    onClick: () => void,
    children: React.ReactNode,
    example: MDXReference<Example>,
    activeExample: MDXReference<Example> | null,
}) {
    const markExampleAsActive = (activeExample?.description && activeExample?.description === example?.description) ||
        (activeExample?.codeblock?.title && activeExample?.codeblock?.title === example.codeblock.title)

    return <button
        onClick={onClick}
        className={`${$button.host} ${markExampleAsActive && $button.$$active}`}
    >
        {children}
    </button>
}
