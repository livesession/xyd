import React, {createContext, useContext, useState, useRef} from "react"

import {TabsPrimary, TabsPrimaryProps} from "./TabsPrimary"
import {TabsSecondary, TabsSecondaryProps} from "./TabsSecondary";
import {TabsAnalytics} from "./TabsAnalytics";

export interface TabsPropsCommon {
    /** The kind of tabs to render. If not provided, the component will render the primary tabs. */
    kind?: 'secondary' | null
}

// // TODO: in the future unify the TabsPrimary and TabsSecondary components?
type TabsProps<T> = T & TabsPropsCommon

const TabsContext = createContext<{
    kind: string | null
}>({
    kind: null,
})

/**
 * A component that renders a tabs component.
 *
 * @category Component
 */
export function Tabs(props: TabsProps<TabsSecondaryProps | TabsPrimaryProps>) {
    let tabs: React.ReactNode

    if (props.kind === 'secondary') {
        tabs = <TabsContext.Provider value={{kind: 'secondary'}}>
            <TabsSecondary {...props} />
        </TabsContext.Provider>

    } else {
        tabs = <TabsContext.Provider value={{kind: null}}>
            <TabsPrimary {...props} />
        </TabsContext.Provider>
    }

    return <TabsAnalytics>
        {tabs}
    </TabsAnalytics>
}

Tabs.Item = function TabsItem(props: any) {
    const {kind} = useContext(TabsContext)

    if (kind === 'secondary') {
        return <TabsSecondary.Item {...props} />
    }

    return <TabsPrimary.Item {...props} />
}
//@ts-ignore TODO: fix ts
Tabs.Item.displayName = "Tabs.Item"

Tabs.Content = function TabsContent(props: any) {
    const {kind} = useContext(TabsContext)

    if (kind === 'secondary') {
        return <TabsSecondary.Content {...props} />
    }

    return <TabsPrimary.Content {...props} />
}
//@ts-ignore TODO: fix ts
Tabs.Content.displayName = "Tabs.Content"