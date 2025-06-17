import React, { createContext, useContext } from "react"

import { TabsPrimary, TabsPrimaryProps } from "./TabsPrimary"
import { TabsSecondary, } from "./TabsSecondary";

// TODO: in the future unify the TabsPrimary and TabsSecondary components?
interface TabsProps {
    /** The variant of the navigation */
    kind?: 'secondary' | null
}

const TabsContext = createContext<TabsProps>({
    kind: null
})

export function Tabs(props: TabsPrimaryProps<any>) {
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

Tabs.Content = function TabsContent(props: any) {
    const { kind } = useContext(TabsContext)

    if (kind === 'secondary') {
        return <TabsSecondary.Content {...props} />
    }

    return <TabsPrimary.Content {...props} />
}