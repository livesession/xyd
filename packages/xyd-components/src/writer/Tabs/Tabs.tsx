import React, { createContext, useContext } from "react"

import { TabsPrimary, TabsPrimaryProps } from "./TabsPrimary"
import { TabsSecondary, TabsSecondaryProps } from "./TabsSecondary";

export interface TabsPropsCommon {
    /** The kind of tabs to render. If not provided, the component will render the primary tabs. */
    kind?: 'secondary' | null
}
// // TODO: in the future unify the TabsPrimary and TabsSecondary components?
type TabsProps<T> = T & TabsPropsCommon

const TabsContext = createContext<any>({
    kind: null
})

/**
 * A component that renders a tabs component.
 * 
 * @category Component
 */
export function Tabs(props: TabsProps<TabsSecondaryProps | TabsPrimaryProps>) {
    // @ts-ignore
    if (props.kind === 'secondary') {
        return (
            <TabsContext value={{ kind: 'secondary' }}>
                <TabsSecondary {...props} />
            </TabsContext>
        )
    }

    return (
        <TabsContext value={{}}>
            <TabsPrimary {...props} />
        </TabsContext>
    )
}


Tabs.Item = function TabsItem(props: any) {
    const { kind } = useContext(TabsContext)

    if (kind === 'secondary') {
        return <TabsSecondary.Item {...props} />
    }

    return <TabsPrimary.Item {...props} />
}
Tabs.Item.displayName = "Tabs.Item"

Tabs.Content = function TabsContent(props: any) {
    const { kind } = useContext(TabsContext)

    if (kind === 'secondary') {
        return <TabsSecondary.Content {...props} />
    }

    return <TabsPrimary.Content {...props} />
}
Tabs.Content.displayName = "Tabs.Content"