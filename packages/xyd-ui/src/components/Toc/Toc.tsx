import React, {useState, useEffect, useContext} from "react"

import * as cn from "./Toc.styles";

export interface TocProps {
    children: React.ReactNode;
    defaultValue?: string
}

const Context = React.createContext({
    value: "",
    onChange: (v: string) => {
    }
})

// TODO: based on scroller?
export function Toc({children, defaultValue}: TocProps) {
    const [activeTrackHeight, setActiveTrackHeight] = useState(0)
    const [activeTrackTop, setActiveTrackTop] = useState(0)
    const [value, setValue] = useState(defaultValue || "")

    function onChange(v: string) {
        setValue(v)
    }

    // TODO: more reactish implt?
    function handleScroll() {
        const activeElement = document.querySelector(`.${cn.TocLinkActive}`);
        if (!activeElement) {
            return;
        }

        const {offsetHeight} = activeElement as HTMLElement;
        setActiveTrackHeight(offsetHeight);

        if (!activeElement?.parentElement) {
            return
        }

        const {offsetTop} = activeElement.parentElement as HTMLElement;
        setActiveTrackTop(offsetTop);
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
            {threshold: 0.3}
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
        onChange
    }}>
        <div className={cn.TocHost}>
            <div className={cn.ScrollerHost}>
                <div
                    style={{
                        // @ts-ignore
                        "--active-track-height": `${activeTrackHeight}px`,
                        "--active-track-top": `${activeTrackTop}px`,
                    }}
                    className={cn.ScrollerScroll}
                />
            </div>
            <ul className={cn.TocUl}>
                {children}
            </ul>
        </div>
    </Context.Provider>
}

export interface TocItemProps {
    children: React.ReactNode;
    value: string;
}

Toc.Item = function TocItem({
                                children,
                                value = "#",
                            }: TocItemProps) {
    const {
        value: rootValue,
        onChange
    } = useContext(Context);

    const href = "#" + value
    const active = rootValue === value;

    return <li className={cn.TocLi}>
        <a
            className={`${cn.TocLink} ${active && cn.TocLinkActive}`}
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
}
