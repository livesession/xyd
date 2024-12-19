import React, {createContext, useContext, useState} from "react";
import {useLocation} from "react-router";

import {FwSidebarItemProps} from "./sidebar";
import { UIContext } from "../../contexts/ui";


export interface FwGroupContext {
    active: (item: FwSidebarItemProps) => [boolean, () => void],
    onClick?: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>, item: FwSidebarItemProps) => void,
}

type GroupBehaviour = (item: FwSidebarItemProps) => [boolean, () => void]

const groupContext = createContext<FwGroupContext>({
    active: () => [false, () => {
    }],
    onClick: () => null // TODO: should be deprecated?
})

export function FwSidebarGroupContext({
                                        children,
                                        onePathBehaviour,
                                        clientSideRouting,
                                    }:
                                        {
                                            children: React.ReactNode,
                                            onePathBehaviour?: boolean,
                                            clientSideRouting?: boolean // TODO: scrollRouting?
                                        }) {

    let groupBehaviour: GroupBehaviour

    if (onePathBehaviour) {
        groupBehaviour = useOnePathBehaviour()
    } else {
        groupBehaviour = useDefaultBehaviour()
    }
    const location = useLocation()

    const [href, setHref] = useState(location.pathname)

    return <UIContext.Provider value={{
        href: href,
        setHref: (value) => {
            setHref(value)
        }
    }}>
        <groupContext.Provider value={{
            active: groupBehaviour,
            onClick: clientSideRouting ? (event, item) => {
                setHref(item.href)
                scrollToDataSlug(event, item)
                // navigate(item.href)
            } : undefined
        }}>
            {children}
        </groupContext.Provider>
    </UIContext.Provider>
}

export function useGroup() {
    return useContext(groupContext)
}


// TODO: !!! better algorithm (JSON.stringify is not good) !!!!!
// TODO: !!!! use array structure instad! !!!

function getLastValue(set) {
    let value;
    for (value of set) ;
    return value;
}

function useDefaultBehaviour() {
    const [weakSet] = useState(() => new Set<string>());
    const [, setForceUpdate] = useState(0);

    const forceUpdate = () => setForceUpdate((prev) => prev + 1);

    const addItem = (item: FwSidebarItemProps) => {
        weakSet.add(JSON.stringify(item));
        forceUpdate();
    };

    const deleteItem = (item: FwSidebarItemProps) => {
        weakSet.delete(JSON.stringify(item));
        forceUpdate();
    };

    const hasItem = (item: FwSidebarItemProps) => {
        return weakSet.has(JSON.stringify(item));
    };

    return (item: FwSidebarItemProps): [boolean, () => void] => [
        hasItem(item) || false,
        () => {
            if (hasItem(item)) {
                deleteItem(item);
            } else {
                addItem(item);
            }
        }
    ]
}

function useOnePathBehaviour() {
    const [weakSet] = useState(() => new Set<string>());
    const [lastLevel, setLastLevel] = useState<false | number | undefined>(false);
    const [, setForceUpdate] = useState(0);

    const forceUpdate = () => setForceUpdate((prev) => prev + 1);

    const addItem = (item: FwSidebarItemProps) => {
        weakSet.add(JSON.stringify(item));
        forceUpdate();
    };

    const deleteItem = (item: FwSidebarItemProps) => {
        weakSet.delete(JSON.stringify(item));
        forceUpdate();
    };

    const hasItem = (item: FwSidebarItemProps) => {
        return weakSet.has(JSON.stringify(item));
    };

    const clear = () => {
        weakSet.clear();
        forceUpdate();
    };

    return (item: FwSidebarItemProps): [boolean, () => void] => [
        hasItem(item),
        () => {
            setLastLevel(item.level)
            if (hasItem(item) && item.level == 0) {
                setLastLevel(false)
                clear()
                return
            }

            if (hasItem(item)) {
                setLastLevel(false)
                deleteItem(item);
                return
            }


            if (((item.level || 0) > (lastLevel || 0)) || lastLevel == false) {
                addItem(item)
            } else {
                const v = getLastValue(weakSet)
                deleteItem(JSON.parse(v))
                addItem(item)
            }
        }
    ]
}

function scrollToDataSlug(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>, item: FwSidebarItemProps) {
    event.preventDefault()

    // TODO: find another solution because data-slug is added by 'atlas'

    const dataSlug = document.querySelector(`[data-slug="${item.href}"]`)

    if (dataSlug) {
        dataSlug.scrollIntoView({block: "start", inline: "nearest"})
    }
}


