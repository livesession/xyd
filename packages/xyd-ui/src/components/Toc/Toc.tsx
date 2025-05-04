import React, { useState, useEffect, useContext, useRef, useCallback } from "react"
import { Link, useLocation, useNavigation } from "react-router"

import * as cn from "./Toc.styles";

export interface TocProps {
    children: React.ReactNode;
    defaultValue?: string
    className?: string
}

interface TocContextType {
    value: string;
    onChange: (v: string) => void;
    registerActiveItem: (ref: React.RefObject<HTMLLIElement | null>, value: string) => void;
    unregisterActiveItem: (value: string) => void;
}

const Context = React.createContext<TocContextType>({
    value: "",
    onChange: (v: string) => { },
    registerActiveItem: (ref: React.RefObject<HTMLLIElement | null>, value: string) => { },
    unregisterActiveItem: (value: string) => { },
})

// TODO: refactor in the future - few hacky ways like using scroll and intersection observer at the same time and much more
export function Toc({ children, defaultValue,className }: TocProps) {
    const [activeTrackHeight, setActiveTrackHeight] = useState<number | undefined>(undefined)
    const [activeTrackTop, setActiveTrackTop] = useState<number | undefined>(undefined)
    const [value, setValue] = useState(defaultValue || "")
    const activeItemsRef = useRef<Map<string, React.RefObject<HTMLLIElement | null>>>(new Map())
    const observerRef = useRef<IntersectionObserver | null>(null)

    function setFirstHeading() {
        const [firstHeading] = Array.from(document.querySelectorAll("h2"))

        setValue(firstHeading.id)
    }

    function setHeadingByHash() {
        const id = window.location.hash.replace("#", "")

        setValue(id)
    }

    function onChange(v: string) {
        setValue(v)
    }

    const registerActiveItem = useCallback((ref: React.RefObject<HTMLLIElement | null>, itemValue: string) => {
        activeItemsRef.current.set(itemValue, ref)
    }, [])

    const unregisterActiveItem = useCallback((itemValue: string) => {
        activeItemsRef.current.delete(itemValue)
    }, [])

    function trackHeight() {
        const activeItemRef = activeItemsRef.current.get(value)
        if (!activeItemRef || !activeItemRef.current) {
            return
        }

        const activeElement = activeItemRef.current

        setActiveTrackHeight(activeElement.offsetHeight)
        setActiveTrackTop(activeElement.offsetTop)
    }

    function observeFn(entries: IntersectionObserverEntry[]) {
        console.log('observe fn')
        let id = ""
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return
            }
            id = entry.target.id
        });

        if (!id) {
            return
        }

        setValue(id)
    }

    function setupObserver() {
        console.log('setup observer')
        observerRef.current = new IntersectionObserver(
            observeFn,
            {
                rootMargin: '-20% 0px -50% 0px',
                threshold: 0
            }
        );

        // TODO: !!! GET TOC LEVEL SETTINGS TO MATCH WITH H3, H4 ETC. !!!
        const headings = Array.from(document.querySelectorAll("h2"))

        headings.forEach(heading => {
            observerRef.current?.observe(heading);
        });
    }

    function getScrollElement() {
        const scrollElement = document.querySelector("[part=page-scroll]")
        if (!scrollElement) {
            return
        }

        return scrollElement
    }

    function initilHashScollEnd() {
        const scrollElement = getScrollElement()
        if (!scrollElement) {
            return
        }

        scrollElement.removeEventListener("scrollend", initilHashScollEnd)
        setupObserver()
    }

    useEffect(() => {
        console.log('use effect')
        if (window.location.hash) {
            setHeadingByHash()

            const scrollElement = getScrollElement()
            if (!scrollElement) {
                return
            }

            scrollElement.addEventListener("scrollend", initilHashScollEnd)

            return () => {
                console.log('disconnect observer')
                if (observerRef.current) {
                    observerRef.current.disconnect()
                }
            }
        }

        setFirstHeading()
        setupObserver()

        return () => {
            console.log('disconnect observer')
            if (observerRef.current) {
                observerRef.current.disconnect()
            }
        }
    }, [])

    useEffect(() => {
        trackHeight();
    }, [value]);

    return <Context.Provider value={{
        value: value,
        onChange,
        registerActiveItem,
        unregisterActiveItem,
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
    id: string;
    className?: string
}

Toc.Item = function TocItem({
    children,
    id,
    className
}: TocItemProps) {
    const {
        value: rootValue,
        onChange,
        registerActiveItem,
        unregisterActiveItem,
    } = useContext(Context);

    const itemRef = useRef<HTMLLIElement>(null)
    const active = rootValue === id;

    useEffect(() => {
        if (active && itemRef.current) {
            registerActiveItem(itemRef, id)
        }

        return () => {
            unregisterActiveItem(id)
        }
    }, [active, id, registerActiveItem, unregisterActiveItem])

    return <xyd-toc-item>
        <li
            ref={itemRef}
            className={`${cn.TocLi} ${className || ""}`}
            data-active={String(active)}
        >
            <Link
                part="link"
                to=""
                // to={{
                //     hash: id
                // }}
                onClick={(e) => {
                    e.preventDefault()
                    onChange(id)

                    const url = new URL(window.location.href)
                    url.hash = id
                    history.replaceState(null, '', url)

                    document.querySelector(`#${id}`)?.scrollIntoView()
                }}
            >
                {children}
            </Link>
        </li>
    </xyd-toc-item>
}

