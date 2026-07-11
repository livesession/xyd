import React, {createContext, useCallback, useContext, useMemo, useState, useEffect} from "react";
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
    // When true, the open/closed state is never auto-reset: navigation / re-render
    // only OPENS the route branch, never closes what the user opened. Manual
    // toggle still collapses. Used where the whole spec is rendered (the API
    // editor), so groups don't collapse from under you while scrolling.
    persist?: boolean
}

export function FooSidebar(props: FooSidebarProps) {
    const {children, initialActiveItems, persist} = props

    const groupBehaviour = useDefaultBehaviour(initialActiveItems, persist) // TODO: support different behaviours?

    // Stable context value — only changes when the active accessor does (a
    // toggle), so consumers don't re-render on every unrelated re-render.
    const value = useMemo(() => ({active: groupBehaviour}), [groupBehaviour])

    return <FooSidebarContext value={value}>
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
function useDefaultBehaviour(initialActiveItems: any[], persist?: boolean) {
    const navigation = useNavigation();
    const [activeItems, setActiveItems] = useState(() => createItemsMap(initialActiveItems));

    useEffect(() => {
        if (persist) {
            // Persist mode: never CLOSE what's open — only merge in the
            // route-active branch (and only if it adds something, so an empty
            // route match — e.g. the editor — is a no-op, not a collapse).
            setActiveItems(prev => {
                const initial = createItemsMap(initialActiveItems);
                let changed = false;
                const next = new Map(prev);
                initial.forEach((_value, key) => {
                    if (!next.get(key)) {
                        next.set(key, true);
                        changed = true;
                    }
                });
                return changed ? next : prev;
            });
            return;
        }
        if (navigation.state !== 'loading') {
            setActiveItems(createItemsMap(initialActiveItems));
        }
    }, [initialActiveItems, navigation.state, persist]);

    // The accessor's identity changes only when `activeItems` changes (i.e. a
    // toggle) — NOT on every render — so the sidebar context stays stable and
    // items don't re-render on unrelated re-renders. `setActiveItems` already
    // triggers the re-render (the old redundant `forceUpdate` is gone).
    return useCallback((item: FooSidebarItemProps): [boolean, () => void] => {
        const key = itemId(item);
        return [
            activeItems.get(key) || false,
            () => {
                setActiveItems(prev => {
                    const newMap = new Map(prev);
                    if (newMap.get(key)) newMap.delete(key);
                    else newMap.set(key, true);
                    return newMap;
                });
            }
        ];
    }, [activeItems]);
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