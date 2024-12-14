import React, {useState, useEffect, useContext} from "react"

import {$toc, $scroller} from "./Toc.styles";

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

    // TODO: more reactish implt?
    function handleScroll() {
        const activeElement = document.querySelector(`.${$toc.link$$active}`);
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

    function onChange(v: string) {
        setValue(v)
    }

    useEffect(() => {
        handleScroll(); // Initial call to set the values
    }, [value]);

    return <Context.Provider value={{
        value: value,
        onChange
    }}>
        <div className={$toc.host}>
            <div className={$scroller.host}>
                <div
                    style={{
                        // @ts-ignore
                        "--active-track-height": `${activeTrackHeight}px`,
                        "--active-track-top": `${activeTrackTop}px`,
                    }}
                    className={$scroller.scroll}
                />
            </div>
            <ul className={$toc.ul}>
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

    return <li className={$toc.li}>
        <a
            className={`${$toc.link} ${active && $toc.link$$active}`}
            href={href}
            onClick={() => onChange(value)}
        >
            {children}
        </a>
    </li>
}