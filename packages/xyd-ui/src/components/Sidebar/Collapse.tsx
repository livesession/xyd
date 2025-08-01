import React, { useEffect, useRef } from "react";
import type { ReactElement, ReactNode } from "react";
import * as cn from "./Collapse.styles";

export interface UICollapseProps {
    children: ReactNode;
    isOpen: boolean;
    horizontal?: boolean;
    className?: string;
}

export function UICollapse({
    children,
    isOpen,
    horizontal = false,
    className,
}: UICollapseProps): ReactElement {
    const containerRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | null>(null);
    const initialOpen = useRef(isOpen);
    const initialRender = useRef(true);
    const observerRef = useRef<MutationObserver | null>(null);
    const lastSizeRef = useRef<number | null>(null);
    const isMutatingRef = useRef(false); // Prevent infinite MutationObserver loop

    const measureAndUpdateDimensions = () => {
        const container = containerRef.current;
        const inner = innerRef.current;
        if (!container || !inner) return;

        const nestedCollapses = inner.querySelectorAll('[class*="collapse"]');
        const originalStyles: Array<{ element: HTMLElement; height: string; overflow: string }> = [];

        nestedCollapses.forEach((collapse) => {
            if (collapse instanceof HTMLElement) {
                originalStyles.push({
                    element: collapse,
                    height: collapse.style.height,
                    overflow: collapse.style.overflow
                });
                collapse.style.height = 'auto';
                collapse.style.overflow = 'visible';
            }
        });

        isMutatingRef.current = true;

        if (horizontal) {
            const width = inner.scrollWidth;
            if (lastSizeRef.current !== width) {
                container.style.width = `${width}px`;
                inner.style.width = `${width}px`;
                lastSizeRef.current = width;
            }
        } else {
            const height = inner.scrollHeight + 5;
            if (lastSizeRef.current !== height) {
                container.style.height = `${height}px`;
                inner.style.height = `${height}px`;
                lastSizeRef.current = height;
            }
        }

        originalStyles.forEach(({ element, height, overflow }) => {
            element.style.height = height;
            element.style.overflow = overflow;
        });

        requestAnimationFrame(() => {
            isMutatingRef.current = false;
        });
    };

    const forceCollapseChildren = (el: HTMLElement) => {
        const allChildren = el.querySelectorAll('[class*="collapse"]');
        allChildren.forEach((child) => {
            const childEl = child as HTMLElement;
            childEl.style.height = `${childEl.scrollHeight}px`; // Set current height
            childEl.offsetHeight; // Force reflow
            childEl.style.height = "0px"; // Collapse
        });
    };

    useEffect(() => {
        const container = containerRef.current;
        const inner = innerRef.current;

        if (animationRef.current) {
            clearTimeout(animationRef.current);
        }
        if (initialRender.current || !container || !inner) return;

        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        if (isOpen) {
            measureAndUpdateDimensions();

            observerRef.current = new MutationObserver((mutations) => {
                if (isMutatingRef.current) return;

                const shouldUpdate = mutations.some(mutation => {
                    return (
                        mutation.type === 'childList' ||
                        mutation.type === 'attributes' ||
                        (mutation.type === 'characterData' &&
                            mutation.target.parentElement?.closest('[class*="collapse"]'))
                    );
                });

                if (shouldUpdate) {
                    measureAndUpdateDimensions();
                }
            });

            observerRef.current.observe(inner, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true,
            });

            animationRef.current = window.setTimeout(() => {
                container.style.removeProperty(horizontal ? "width" : "height");
                inner.style.removeProperty(horizontal ? "width" : "height");
                if (observerRef.current) {
                    observerRef.current.disconnect();
                }
            }, 300);
        } else {
            if (horizontal) {
                const width = container.scrollWidth;
                container.style.width = `${width}px`;
                container.offsetWidth;
                container.style.width = "0px";
                lastSizeRef.current = 0;
            } else {
                const height = container.scrollHeight + 5;
                forceCollapseChildren(container); // 👈 Ensure nested children collapse smoothly
                container.style.height = `${height}px`;
                container.offsetHeight;
                container.style.height = "0px";
                lastSizeRef.current = 0;
            }
        }

        return () => {
            if (observerRef.current) observerRef.current.disconnect();
            if (animationRef.current) clearTimeout(animationRef.current);
        };
    }, [horizontal, isOpen]);

    useEffect(() => {
        initialRender.current = false;
    }, []);

    return (
        <xyd-collapse
            data-open={String(isOpen)}
            className={`${cn.CollapseHost} ${className || ""}`}
            ref={containerRef}
            style={initialOpen.current || horizontal ? undefined : { height: 0 }}
        >
            <div part="child" ref={innerRef}>
                {children}
            </div>
        </xyd-collapse>
    );
}
