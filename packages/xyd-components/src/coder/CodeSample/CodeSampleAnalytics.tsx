import React, {useEffect, useState} from "react";

import {UXNode} from "openux-js";

import {useTabsAnalytics} from "../../writer/Tabs/TabsAnalytics";
import {EVENT_COMPONENT_TAB_CHANGE, useUXEvents} from "../../uxEvents";

const CodeSampleAnalyticsContext = React.createContext<{
    setActiveTab: (tab: string) => void

    setActiveExample: (example: string) => void
}>({
    setActiveTab: () => {
    },

    setActiveExample: () => {
    }
})

export function useCodeSampleAnalytics() {
    return React.useContext(CodeSampleAnalyticsContext)
}

export function CodeSampleAnalytics({children}: { children: React.ReactNode }) {
    const [activeTab, setActiveTab] = useState("")
    const [activeExample, setActiveExample] = useState("")
    const tabs = useTabsAnalytics()
    useExampleTabChange()

    useEffect(() => {
        setActiveExample(tabs.value)
    }, [tabs.value])

    return (
        <CodeSampleAnalyticsContext value={{
            setActiveTab,
            setActiveExample
        }}>
            <UXNode
                name="CodeSample"
                props={{
                    tab: activeTab,
                    example: activeExample,
                    code: ""
                }}
            >
                {children}
            </UXNode>
        </CodeSampleAnalyticsContext>
    );
}

// TODO: better API
function useExampleTabChange() {
    const tabs = useTabsAnalytics()
    const ux = useUXEvents();

    useEffect(() => {
        const tabsElement = tabs.tabsRef.current;
        if (!tabsElement) {
            return
        }

        function handleTabChange(event: CustomEvent) {
            const {value} = event.detail;
            ux.CodeExampleChange({
                example: value,
            })
        };

        tabsElement.addEventListener(EVENT_COMPONENT_TAB_CHANGE, handleTabChange as EventListener);

        return () => {
            tabsElement.removeEventListener(EVENT_COMPONENT_TAB_CHANGE, handleTabChange as EventListener);
        };
    }, [tabs.tabsRef.current]);
}