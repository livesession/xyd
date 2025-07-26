import React, {createContext, useContext, useState, useEffect} from "react";
import {useNavigation} from "react-router";

// TODO: better interface
export interface FooSidebarItemProps {
    readonly uniqIndex: number

    readonly level?: number

    readonly groupIndex?: number

    readonly itemIndex?: number
}

interface IFooSidebarContext {
    active: (item: FooSidebarItemProps) => [boolean, () => void],
}

const FooSidebarContext = createContext<IFooSidebarContext>({
    active: () => [false, () => {
    }],
})

interface FooSidebarProps {
    children: React.ReactNode,
    initialActiveItems: any[]
}

export function FooSidebar(props: FooSidebarProps) {
    const {children, initialActiveItems} = props

    const groupBehaviour = useDefaultBehaviour(initialActiveItems) // TODO: support different behaviours?

    return <FooSidebarContext value={{
        active: groupBehaviour,
    }}>
        {children}
    </FooSidebarContext>
}

export function useFooSidebar() {
    return useContext(FooSidebarContext)
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

    function addItem(item: FooSidebarItemProps) {
        const key = itemId(item);

        setActiveItems(prev => {
            const newMap = new Map(prev);
            newMap.set(key, true);
            return newMap;
        });
        forceUpdate();
    }

    function deleteItem(item: FooSidebarItemProps) {
        const key = itemId(item);

        setActiveItems(prev => {
            const newMap = new Map(prev);
            newMap.delete(key);
            return newMap;
        });
        forceUpdate();
    }

    function hasItem(item: FooSidebarItemProps) {
        const key = itemId(item);

        return activeItems.get(key) || false;
    }

    return (item: FooSidebarItemProps): [boolean, () => void] => {
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

function itemId(item: FooSidebarItemProps) {
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