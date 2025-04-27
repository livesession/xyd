import React, { createContext, useContext, useState, useEffect } from "react";

import { FwSidebarItemProps } from "./Sidebar";

export interface FwGroupContext {
    active: (item: FwSidebarItemProps) => [boolean, () => void],
}

const GroupContext = createContext<FwGroupContext>({
    active: () => [false, () => {
    }],
})

interface FwSidebarGroupContextProps {
    children: React.ReactNode,
    initialActiveItems: any[]
}

export function FwSidebarGroupContext(props: FwSidebarGroupContextProps) {
    const { children, initialActiveItems } = props

    const groupBehaviour = useDefaultBehaviour(initialActiveItems) // TODO: support different behaviours?

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

function stringify(item: FwSidebarItemProps) {
    return JSON.stringify({
        title: item.title,
        href: item.href,
        items: item.items?.map((item) => stringify(item)),
    })
}

// Helper function to create a map from initialActiveItems
function createItemsMap(items: any[]): Map<string, string> {
    const map = new Map<string, string>();
    items.forEach(item => {
        const key = `${item.groupIndex}-${item.level}`;
        map.set(key, stringify(item));
    });
    return map;
}

// TOOD: issues if same page url on initialitems
// TODO: the time of chaning is not perfectly the same with react-router 
// TODO: better data structure + algorithm
function useDefaultBehaviour(initialActiveItems: any[]) {
    const [activeItems, setActiveItems] = useState(() => createItemsMap(initialActiveItems));

    const [currentGroupIndex, setCurrentGroupIndex] = useState<number | null>(() => {
        return initialActiveItems[0]?.groupIndex ?? null;
    });
    const [, setForceUpdate] = useState(0);

    const forceUpdate = () => setForceUpdate((prev) => prev + 1);

    // Update activeItems and currentGroupIndex when initialActiveItems changes
    useEffect(() => {
        setActiveItems(createItemsMap(initialActiveItems));
        
        if (initialActiveItems.length > 0) {
            setCurrentGroupIndex(initialActiveItems[0]?.groupIndex ?? null);
        }

        forceUpdate();
    }, [initialActiveItems]);

    const addItem = (item: FwSidebarItemProps) => {
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
                return;
            }

            deleteItem(item);
        }
    ]
}


