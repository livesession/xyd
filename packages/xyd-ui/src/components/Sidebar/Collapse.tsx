import React, {useEffect, useRef} from "react";
import type {ReactElement, ReactNode} from "react";
import {$collapse} from "./Collapse.styles";

export interface UICollapseProps {
    children: ReactNode;
    isOpen: boolean;
    horizontal?: boolean;
}

export function UICollapse({
                               children,
                               isOpen,
                               horizontal = false,
                           }: UICollapseProps): ReactElement {
    const containerRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | null>(null);
    const initialOpen = useRef(isOpen);
    const initialRender = useRef(true);

    useEffect(() => {
        const container = containerRef.current;
        const inner = innerRef.current;

        if (animationRef.current) {
            clearTimeout(animationRef.current);
        }
        if (initialRender.current || !container || !inner) return;

        if (isOpen) {
            // Opening animation
            if (horizontal) {
                inner.style.width = `${inner.scrollWidth}px`;
                container.style.width = `${inner.scrollWidth}px`;
            } else {
                inner.style.height = `${inner.scrollHeight}px`;
                container.style.height = `${inner.scrollHeight}px`;
            }

            animationRef.current = window.setTimeout(() => {
                container.style.removeProperty(horizontal ? "width" : "height");
            }, 300);
        } else {
            // Closing animation
            if (horizontal) {
                const width = container.scrollWidth; // Cache current width
                container.style.width = `${width}px`; // Set to fixed width first

                // Force reflow for Firefox
                container.offsetWidth;

                container.style.width = "0px";
            } else {
                const height = container.scrollHeight; // Cache current height
                container.style.height = `${height}px`; // Set to fixed height first

                // Force reflow for Firefox
                container.offsetHeight;

                container.style.height = "0px";
            }
        }
    }, [horizontal, isOpen]);

    useEffect(() => {
        initialRender.current = false;
    }, []);

    return (
        <div
            ref={containerRef}
            className={`${$collapse.container}`}
            style={initialOpen.current || horizontal ? undefined : {height: 0}}
        >
            <div
                ref={innerRef}
                className={`${$collapse.base} ${isOpen ? $collapse.open : ""}`}
            >
                {children}
            </div>
        </div>
    );
}
