import React, {useEffect, useRef} from 'react'
import {ArrowRightIcon} from '@radix-ui/react-icons'
import {tv} from "tailwind-variants";

function styled() {
}

styled.backToTop = tv({
    slots: {
        button: "flex items-center gap-1.5 transition opacity-0",
        icon: "-rotate-90 w-3.5 h-3.5 border rounded-full border-current"
    }
})

const SCROLL_TO_OPTIONS = {top: 0, behavior: 'smooth'} as const

function scrollToTop(event) {
    const buttonElement = event.currentTarget
    const tocElement = buttonElement.parentElement!.parentElement!

    window.scrollTo(SCROLL_TO_OPTIONS)
    tocElement.scrollTo(SCROLL_TO_OPTIONS)

    buttonElement.disabled = true
    window.scrollTo({top: 0, behavior: 'smooth'})
}

export interface HBackToTopProps {
    children: JSX.Element

    className?: string
}

export function HBackToTop(props: HBackToTopProps) {
    const {button, icon} = styled.backToTop()
    const ref = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        function toggleVisible() {
            const {scrollTop} = document.documentElement
            ref.current?.classList.toggle('opacity-0', scrollTop < 10)
        }

        window.addEventListener('scroll', toggleVisible)
        return () => {
            window.removeEventListener('scroll', toggleVisible)
        }
    }, [])

    return (
        <button
            ref={ref}
            aria-hidden="true"
            onClick={scrollToTop}
            className={button({class: props.className})}
        >
            Scroll to top
            {props.children}
            <ArrowRightIcon className={icon()}/>
        </button>
    )
}
