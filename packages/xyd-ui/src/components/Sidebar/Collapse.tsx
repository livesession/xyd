import React, { useEffect, useRef } from "react";
import type { ReactElement, ReactNode } from "react";
import * as cn from "./Collapse.styles";

export interface UICollapseProps {
    children: ReactNode;
    isOpen: boolean;
    horizontal?: boolean;
    className?: string;
}

// TODO: !!! FIX COLLAPSE !!!
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

    const measureAndUpdateDimensions = () => {
        const container = containerRef.current;
        const inner = innerRef.current;
        if (!container || !inner) return;

        // Temporarily make all nested content visible for measurement
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

        if (horizontal) {
            const width = inner.scrollWidth;
            container.style.width = `${width}px`;
            inner.style.width = `${width}px`;
        } else {
            const height = inner.scrollHeight;
            container.style.height = `${height + 5}px`;
            inner.style.height = `${height + 5}px`;
        }

        // Restore original styles
        originalStyles.forEach(({ element, height, overflow }) => {
            element.style.height = height;
            element.style.overflow = overflow;
        });
    };

    useEffect(() => {
        const container = containerRef.current;
        const inner = innerRef.current;

        if (animationRef.current) {
            clearTimeout(animationRef.current);
        }
        if (initialRender.current || !container || !inner) return;

        // Clean up previous observer
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        if (isOpen) {
            // Opening animation
            measureAndUpdateDimensions();

            // Set up mutation observer to watch for content changes
            observerRef.current = new MutationObserver((mutations) => {
                // Check if the mutation affects height
                const shouldUpdate = mutations.some(mutation => {
                    return mutation.type === 'childList' ||
                        mutation.type === 'attributes' ||
                        (mutation.type === 'characterData' && mutation.target.parentElement?.closest('[class*="collapse"]'));
                });

                if (shouldUpdate) {
                    measureAndUpdateDimensions();
                }
            });

            observerRef.current.observe(inner, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true
            });

            animationRef.current = window.setTimeout(() => {
                container.style.removeProperty(horizontal ? "width" : "height");
                inner.style.removeProperty(horizontal ? "width" : "height");
                if (observerRef.current) {
                    observerRef.current.disconnect();
                }
            }, 300);
        } else {
            // Closing animation
            if (horizontal) {
                const width = container.scrollWidth;
                container.style.width = `${width}px`;
                container.offsetWidth; // Force reflow
                container.style.width = "0px";
            } else {
                const height = container.scrollHeight;
                container.style.height = `${height + 5}px`;
                container.offsetHeight; // Force reflow
                container.style.height = "0px";
            }
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
            if (animationRef.current) {
                clearTimeout(animationRef.current);
            }
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
            <div
                part="child"
                ref={innerRef}
            >
                {children}
            </div>
        </xyd-collapse>
    );
}
