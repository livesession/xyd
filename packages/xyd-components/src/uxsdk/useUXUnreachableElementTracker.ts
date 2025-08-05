import { useEffect, useRef, useCallback } from "react"

/**
 * TODO: not ideal solution cuz sometimes has a bug but currently its enough
 * 
 * This hook is used to track the hover and click events of an unreachable element.
 */
export function useUXUnreachableElementTracker(
    element: React.RefObject<HTMLElement | null>,
    hoverCb: () => void,
    clickCb: () => void
) {
    const hover = useRef(false)
    const click = useRef(false)
    const mouseLeaveTimeout = useRef<number | null>(null)

    const lastHoverTime = useRef(0)
    const DEBOUNCE_DELAY = 1000 // 1 second debounce
    const MOUSE_LEAVE_DELAY = 50 // 50ms delay to allow visibilitychange to fire first

    const handleMouseEnter = useCallback(() => {
        const now = Date.now()
        if (now - lastHoverTime.current > DEBOUNCE_DELAY) {
            hover.current = true
            lastHoverTime.current = now
            hoverCb()
        }
    }, [hoverCb])

    const handleMouseLeave = useCallback(() => {
        // console.log("mouse leave")
        // Clear any existing timeout
        if (mouseLeaveTimeout.current) {
            clearTimeout(mouseLeaveTimeout.current)
        }
        
        // Delay setting hover to false to allow visibilitychange to fire first
        mouseLeaveTimeout.current = setTimeout(() => {
            hover.current = false
            mouseLeaveTimeout.current = null
        }, MOUSE_LEAVE_DELAY)
    }, [])

    useEffect(() => {
        if (!element.current) {
            return
        }

        element.current.addEventListener("mouseenter", handleMouseEnter)
        element.current.addEventListener("mouseleave", handleMouseLeave)

        return () => {
            if (element.current) {
                element.current.removeEventListener("mouseenter", handleMouseEnter)
                element.current.removeEventListener("mouseleave", handleMouseLeave)
            }
            // Clean up timeout on unmount
            if (mouseLeaveTimeout.current) {
                clearTimeout(mouseLeaveTimeout.current)
            }
        }

    }, [element.current, handleMouseEnter, handleMouseLeave])

    // detect visibility loss (e.g. new tab opened)
    const handleVisibilityChange = useCallback(() => {
        // Clear the mouseleave timeout since visibility change indicates a click
        if (mouseLeaveTimeout.current) {
            clearTimeout(mouseLeaveTimeout.current)
            mouseLeaveTimeout.current = null
        }
        
        click.current = false
        // console.log(hover, 7777)
        if (hover.current) {
            hover.current = false
            click.current = true
            clickCb()
        }
    }, [clickCb])

    useEffect(() => {
        // function handleBeforeUnload() {
        //     console.log(hover.current)
        //     console.log(111)
        // }

        // window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            // window.removeEventListener('beforeunload', handleBeforeUnload)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            // Clean up timeout on unmount
            if (mouseLeaveTimeout.current) {
                clearTimeout(mouseLeaveTimeout.current)
            }
        }
    }, [handleVisibilityChange]) // Add handleVisibilityChange back to dependencies since it's now memoized
}