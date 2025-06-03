import React, { createContext, useContext, useState, useEffect } from "react";

import { FwSidebarItemProps } from "./Sidebar";
import { useLocation, useNavigation } from "react-router";

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

// TOOD: issues if same page url on initialitems
// TODO: the time of chaning is not perfectly the same with react-router 
// TODO: better data structure + algorithm
// TODO: !!!! REFACTOR !!! !!! nagivation loaders !!!
function useDefaultBehaviour(initialActiveItems: any[]) {
    const navigation = useNavigation();
    const [activeItems, setActiveItems] = useState(() => createItemsMap(initialActiveItems));

    const [, setForceUpdate] = useState(0);
    const forceUpdate = () => setForceUpdate((prev) => prev + 1);

    useEffect(() => {
        if (navigation.state !== 'loading') {
            setActiveItems(createItemsMap(initialActiveItems));
            forceUpdate();
        }
    }, [initialActiveItems, navigation.state]);

    function addItem(item: FwSidebarItemProps) {
        const key = itemId(item);

        setActiveItems(prev => {
            const newMap = new Map(prev);
            newMap.set(key, true);
            return newMap;
        });
        forceUpdate();
    }

    function deleteItem(item: FwSidebarItemProps) {
        const key = itemId(item);

        setActiveItems(prev => {
            const newMap = new Map(prev);
            newMap.delete(key);
            return newMap;
        });
        forceUpdate();
    }

    function hasItem(item: FwSidebarItemProps) {
        const key = itemId(item);

        return activeItems.get(key) || false;
    }

    return (item: FwSidebarItemProps): [boolean, () => void] => {
        return [
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
}

function itemId(item: FwSidebarItemProps) {
    const id = `${item.uniqIndex}:${item.groupIndex}-${item.level}-${item.itemIndex}`
    
    return id;
}

function createItemsMap(items: any[]): Map<string, boolean> {
    const map = new Map<string, boolean>();
    items.forEach(item => {
        const key = itemId(item);
        map.set(key, true);
    });
    return map;
}