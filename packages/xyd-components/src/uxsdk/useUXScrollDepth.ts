import React, {useEffect, useRef} from "react";

export interface ScrollDepthOptions {
    thresholds?: number[]; // Default: [25, 50, 75, 100]
    onDepthReached?: (depth: number) => void;
}

export function useUXScrollDepth(
    ref: React.RefObject<HTMLElement | null>, 
    options: ScrollDepthOptions = {}
) {
    const { thresholds = [25, 50, 75, 100], onDepthReached } = options;
    const reachedDepthsRef = useRef<Set<number>>(new Set());

    useEffect(() => {
        if (!ref.current) {
            return
        }

        function handleScroll() {
            const element = ref.current;
            if (!element) return;

            const { scrollTop, scrollHeight, clientHeight } = element;
            
            // Calculate current scroll percentage
            const scrollableHeight = scrollHeight - clientHeight;
            if (scrollableHeight <= 0) return;
            
            const scrollPercentage = Math.round((scrollTop / scrollableHeight) * 100);
            
            // Check which thresholds have been reached
            thresholds.forEach(threshold => {
                if (scrollPercentage >= threshold && !reachedDepthsRef.current.has(threshold)) {
                    reachedDepthsRef.current.add(threshold);
                    onDepthReached?.(threshold);
                }
            });
        }

        const element = ref.current;
        element.addEventListener('scroll', handleScroll);

        return () => {
            element.removeEventListener('scroll', handleScroll);
        };
    }, [ref.current, thresholds, onDepthReached]);
}

