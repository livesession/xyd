import React, {createContext, useContext, useEffect, useState} from "react";
import {useLocation, useNavigation, useNavigate} from "react-router";

import {FwSidebarGroupProps, FwSidebarItemProps} from "./sidebar";
import {UIContext} from "../../contexts/ui";
import {useSidebarGroups} from "../../contexts";


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
                                          initialActiveItems,
                                      }:
                                      {
                                          children: React.ReactNode,
                                          onePathBehaviour?: boolean,
                                          clientSideRouting?: boolean // TODO: scrollRouting?,
                                          initialActiveItems: any[]
                                      }) {

    let groupBehaviour: GroupBehaviour

    if (onePathBehaviour) {
        groupBehaviour = useOnePathBehaviour(initialActiveItems)
    } else {
        groupBehaviour = useDefaultBehaviour(initialActiveItems)
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

function stringify(item: FwSidebarItemProps) {
    return JSON.stringify({
        title: item.title,
        href: item.href,
        items: item.items?.map((item) => stringify(item)),
    })
}

function recursiveSearch(items: FwSidebarItemProps[], href: string, levels: any[] = []) {
    for (let i = 0; i < items.length; i++) {
        const item = items[i]

        if (item.href === href) {
            return [...levels, i]
        }

        if (item.items) {
            const result = recursiveSearch(item.items, href, [...levels, i])
            if (result) {
                return result
            }
        }
    }
    return null
}

function calcActive(groups: FwSidebarGroupProps[], url: any) {
    const initialActiveItems: any[] = []

    groups.forEach(group => {
        const activeLevels = recursiveSearch(group.items, url) || []

        activeLevels.reduce((acc, index) => {
            initialActiveItems.push({
                ...acc[index],
                active: true
            })
            return acc[index].items
        }, group.items)

        return group
    })

    return initialActiveItems
}

function useDefaultBehaviour(initialActiveItems: any[]) {
    const groups = useSidebarGroups()
    const [weakSet] = useState(() => new Set<string>(initialActiveItems.map((item) => stringify(item))));
    const [, setForceUpdate] = useState(0);

    useEffect(() => {
        window.addEventListener('xyd.history.pushState', (event: CustomEvent) => {
            const url = event.detail?.url

            if (!url) {
                return
            }
            // TODO: better data structures
            const active = calcActive(groups, url)
            weakSet.clear()
            active.forEach((item) => {
                addItem(item)
            })
        });
    }, [])

    const forceUpdate = () => setForceUpdate((prev) => prev + 1);

    const addItem = (item: FwSidebarItemProps) => {
        weakSet.add(stringify(item));
        forceUpdate();
    };

    const deleteItem = (item: FwSidebarItemProps) => {
        weakSet.delete(stringify(item));
        forceUpdate();
    };

    const hasItem = (item: FwSidebarItemProps) => {
        return weakSet.has(stringify(item));
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

function useOnePathBehaviour(initialActiveItems: any[]) {
    const [weakSet] = useState(() => new Set<string>(initialActiveItems.map((item) => stringify(item))));
    const [lastLevel, setLastLevel] = useState<false | number | undefined>(false);
    const [, setForceUpdate] = useState(0);

    const forceUpdate = () => setForceUpdate((prev) => prev + 1);

    const addItem = (item: FwSidebarItemProps) => {
        weakSet.add(stringify(item));
        forceUpdate();
    };

    const deleteItem = (item: FwSidebarItemProps) => {
        weakSet.delete(stringify(item));
        forceUpdate();
    };

    const hasItem = (item: FwSidebarItemProps) => {
        return weakSet.has(stringify(item));
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


