import React, {createContext, useContext, useRef, useState} from "react";

const TabsAnalyticsContext = createContext<{
    value: string
    setValue: (value: string) => void
    tabsRef: React.RefObject<HTMLElement | null>
}>({
    value: "",
    setValue: () => {
    },
    tabsRef: {current: null}
})

export function TabsAnalytics({children}: { children: React.ReactNode }) {
    const [value, setValue] = useState("")
    const tabsRef = useRef<HTMLElement | null>(null)

    return <TabsAnalyticsContext value={{value, setValue, tabsRef}}>
        {children}
    </TabsAnalyticsContext>
}

export function useTabsAnalytics() {
    return useContext(TabsAnalyticsContext)
}