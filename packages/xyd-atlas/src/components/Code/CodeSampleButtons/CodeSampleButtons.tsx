import React, {useState, useRef, useEffect} from 'react'
import {ChevronLeft, ChevronRight} from "lucide-react"

import {Example} from "@xyd-js/uniform";

import * as cn from "./CodeSampleButtons.styles";

export interface CodeExampleButtonsProps {
    examples: Example[]
    activeExample: Example | null
    onClick: (example: Example) => void
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
        <div className={cn.CodeSampleButtonsHost}>
            <div className={cn.CodeSampleButtonsContainer}>
                {showLeftArrow && (
                    <button
                        onClick={() => scroll('left')}
                        className={cn.CodeSampleButtonsArrowHost}
                    >
                        <ChevronLeft className={cn.CodeSampleButtonsArrowIcon}/>
                    </button>
                )}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className={cn.CodeSampleButtonsScrollerHost}
                >
                    <div className={cn.CodeSampleButtonsScrollerContainer}>
                        {examples?.map((example) => (
                            <SampleButton
                                key={example.codeblock.title}
                                onClick={() => onClick(example)}
                                example={example}
                                activeExample={activeExample}
                            >
                                {(example.codeblock.title || null)}
                            </SampleButton>
                        ))}
                    </div>
                </div>
                {showRightArrow && (
                    <button
                        onClick={() => scroll('right')}
                        className={cn.CodeSampleButtonsArrowHost}
                    >
                        <ChevronRight className={cn.CodeSampleButtonsArrowIcon}/>
                    </button>
                )}
            </div>
        </div>
    )
}

function SampleButton({onClick, children, activeExample, example}: {
    onClick: () => void,
    children: React.ReactNode,
    example: Example,
    activeExample: Example | null,
}) {
    const markExampleAsActive = (activeExample?.description && activeExample?.description === example?.description) ||
        (activeExample?.codeblock?.title && activeExample?.codeblock?.title === example.codeblock.title)

    return <button
        onClick={onClick}
        className={`${cn.CodeSampleButtonsButtonHost} ${markExampleAsActive && cn.CodeSampleButtonsButtonActive}`}
    >
        {children}
    </button>
}
