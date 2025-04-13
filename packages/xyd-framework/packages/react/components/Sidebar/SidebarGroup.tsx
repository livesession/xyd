import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation, useNavigation, useNavigate } from "react-router";

import { FwSidebarGroupProps, FwSidebarItemProps } from "./Sidebar";
import { UIContext } from "../../contexts/ui";
import { useSidebarGroups } from "../../contexts";


export interface FwGroupContext {
    active: (item: FwSidebarItemProps) => [boolean, () => void],
}

type GroupBehaviour = (item: FwSidebarItemProps) => [boolean, () => void]

const GroupContext = createContext<FwGroupContext>({
    active: () => [false, () => {
    }],
})

export function FwSidebarGroupContext({
    children,
    onePathBehaviour,
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
        throw new Error("One path behaviour is not implemente yet")
    } else {
        groupBehaviour = useDefaultBehaviour(initialActiveItems)
    }

    return <GroupContext value={{
        active: groupBehaviour,
    }}>
        {children}
    </GroupContext>
}

export function useGroup() {
    return useContext(GroupContext)
}


// TODO: !!! better algorithm (JSON.stringify is not good) !!!!!
// TODO: !!!! use array structure instad! !!!

function getLastValue(set) {
    let value;
    for (value of set);
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

// TOOD: issues if same page url on initialitems
// TODO: the time of chaning is not perfectly the same with react-router 
function useDefaultBehaviour(initialActiveItems: any[]) {
    const groups = useSidebarGroups()
    const [activeItems] = useState(() => {
        const map = new Map<string, string>();
        initialActiveItems.forEach(item => {
            const key = `${item.groupIndex}-${item.level}`;
            map.set(key, stringify(item));
        });
        return map;
    });
    const [currentGroupIndex, setCurrentGroupIndex] = useState<number | null>(() => {
        return initialActiveItems[0]?.groupIndex ?? null;
    });
    const [, setForceUpdate] = useState(0);

    useEffect(() => {
        window.addEventListener('xyd.history.pushState', (event: CustomEvent) => {
            const url = event.detail?.url

            if (!url) {
                return
            }
            const active = calcActive(groups, url)
            activeItems.clear()
            active.forEach((item) => {
                const key = `${item.groupIndex}-${item.level}`;
                activeItems.set(key, stringify(item));
                if (item.groupIndex !== undefined) {
                    setCurrentGroupIndex(item.groupIndex);
                }
            })
            forceUpdate();
        });
    }, [])

    const forceUpdate = () => setForceUpdate((prev) => prev + 1);

    const addItem = (item: FwSidebarItemProps) => {
        // If switching groups, clear all items
        if (item.groupIndex !== undefined && item.groupIndex !== currentGroupIndex) {
            activeItems.clear();
            setCurrentGroupIndex(item.groupIndex);
        }

        const key = `${item.groupIndex}-${item.level}`;
        activeItems.set(key, stringify(item));
        forceUpdate();
    };

    const deleteItem = (item: FwSidebarItemProps) => {
        const key = `${item.groupIndex}-${item.level}`;
        activeItems.delete(key);
        forceUpdate();
    };

    const hasItem = (item: FwSidebarItemProps) => {
        const key = `${item.groupIndex}-${item.level}`;
        const activeItem = activeItems.get(key);
        return activeItem === stringify(item);
    };

    return (item: FwSidebarItemProps): [boolean, () => void] => [
        hasItem(item) || false,
        () => {
            if (!hasItem(item)) {
                addItem(item);

                return
            }

            if (!item.level) {
                return
            }

            deleteItem(item);
        }
    ]
}


