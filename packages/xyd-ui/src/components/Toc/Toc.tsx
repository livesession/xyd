import React, { useState, useEffect, useContext, useRef, useCallback } from "react"

import * as cn from "./Toc.styles";

export interface TocProps {
    children: React.ReactNode;
    defaultValue?: string
    className?: string
}

const Context = React.createContext({
    value: "",
    onChange: (v: string) => {
    },
    registerActiveItem: (ref: React.RefObject<HTMLLIElement | null>, value: string) => {},
    unregisterActiveItem: (value: string) => {}
})

// TODO: based on scroller?
export function Toc({ children, defaultValue, className }: TocProps) {
    const [activeTrackHeight, setActiveTrackHeight] = useState(0)
    const [activeTrackTop, setActiveTrackTop] = useState(0)
    const [value, setValue] = useState(defaultValue || "")
    const activeItemsRef = useRef<Map<string, React.RefObject<HTMLLIElement | null>>>(new Map())

    function onChange(v: string) {
        setValue(v)
    }

    const registerActiveItem = useCallback((ref: React.RefObject<HTMLLIElement | null>, itemValue: string) => {
        activeItemsRef.current.set(itemValue, ref)
    }, [])

    const unregisterActiveItem = useCallback((itemValue: string) => {
        activeItemsRef.current.delete(itemValue)
    }, [])

    // More React-like implementation using refs
    function handleScroll() {
        const activeItemRef = activeItemsRef.current.get(value)
        if (!activeItemRef || !activeItemRef.current) {
            return
        }

        const activeElement = activeItemRef.current
        setActiveTrackHeight(activeElement.offsetHeight)
        setActiveTrackTop(activeElement.offsetTop)
    }

    // TODO: more reactish
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                let set = false
                entries.forEach(entry => {
                    if (set) {
                        return
                    }
                    if (!entry.isIntersecting) {
                        return
                    }

                    if (entry.target instanceof HTMLHeadingElement) {
                        const rect = entry.target.getBoundingClientRect();
                        const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;

                        if (isVisible) {
                            set = true
                            setValue(entry.target.innerText);
                        }
                    }
                });
            },
            { threshold: 0.3 }
        );

        document.querySelectorAll("h2").forEach(ref => {
            if (ref) observer.observe(ref);
        });

        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        handleScroll(); // Initial call to set the values
    }, [value]);

    return <Context.Provider value={{
        value: value,
        onChange,
        registerActiveItem,
        unregisterActiveItem
    }}>
        <xyd-toc className={`${cn.TocHost} ${className || ""}`}>
            <div part="scroller">
                <div
                    part="scroll"
                    style={{
                        // @ts-ignore
                        "--xyd-toc-active-track-height": `${activeTrackHeight}px`,
                        "--xyd-toc-active-track-top": `${activeTrackTop}px`,
                    }}
                />
            </div>
            <ul part="list">
                {children}
            </ul>
        </xyd-toc>
    </Context.Provider>
}

export interface TocItemProps {
    children: React.ReactNode;
    value: string;
    className?: string
}

Toc.Item = function TocItem({
    children,
    value = "#",
    className
}: TocItemProps) {
    const {
        value: rootValue,
        onChange,
        registerActiveItem,
        unregisterActiveItem
    } = useContext(Context);

    const itemRef = useRef<HTMLLIElement>(null)
    const href = "#" + value
    const active = rootValue === value;

    useEffect(() => {
        if (active && itemRef.current) {
            registerActiveItem(itemRef, value)
        }

        return () => {
            unregisterActiveItem(value)
        }
    }, [active, value, registerActiveItem, unregisterActiveItem])

    return <xyd-toc-item>
        <li
            ref={itemRef}
            className={`${cn.TocLi} ${className || ""}`}
            data-active={String(active)}
        >
            <a
                part="link"
                href={href}
                onClick={(e) => {
                    // TODO: use react-router but for some reason does not work
                    e.preventDefault()
                    onChange(value)

                    let found = false

                    // TODO: below is only a temporary solution
                    document.querySelectorAll("h2").forEach(e => {
                        if (found) {
                            return
                        }

                        if (e.innerText === value) {
                            found = true
                            e.scrollIntoView()
                        }
                    })
                }}
            >
                {children}
            </a>
        </li>
    </xyd-toc-item>
}

