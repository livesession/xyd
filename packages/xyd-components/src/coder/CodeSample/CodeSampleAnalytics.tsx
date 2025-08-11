import React, { useEffect, useRef, useState } from "react";

import { UXNode } from "openux-js";

import { useTabsAnalytics } from "../../writer/Tabs/TabsAnalytics";
import { EVENT_COMPONENT_TAB_CHANGE, useUXEvents, useUXScrollDepth } from "../../uxsdk";

const CodeSampleAnalyticsContext = React.createContext<{
    ref: React.RefObject<HTMLPreElement | null>

    setActiveTab: (tab: string) => void

    setActiveExample: (example: string) => void
}>({
    ref: {
        current: null
    },

    setActiveTab: () => {
    },

    setActiveExample: () => {
    }
})

export function useCodeSampleAnalytics() {
    return React.useContext(CodeSampleAnalyticsContext)
}

export function CodeSampleAnalytics({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLPreElement>(null);
    const [activeTab, setActiveTab] = useState("")
    const [activeExample, setActiveExample] = useState("")

    const tabs = useTabsAnalytics()

    useEffect(() => {
        setActiveExample(tabs.value)
    }, [tabs.value])

    return (
        <CodeSampleAnalyticsContext value={{
            ref,
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
                <CodeSampleAnalyticsHooks>
                    {children}
                </CodeSampleAnalyticsHooks>
            </UXNode>
        </CodeSampleAnalyticsContext>
    );
}

function CodeSampleAnalyticsHooks({ children }: { children: React.ReactNode }) {
    useExampleTabChange()
    useCodeSampleScroll()

    return children
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
            const { value } = event.detail;
            ux.docs.code.example_change({
                example: value,
            })
        };

        tabsElement.addEventListener(EVENT_COMPONENT_TAB_CHANGE, handleTabChange as EventListener);

        return () => {
            tabsElement.removeEventListener(EVENT_COMPONENT_TAB_CHANGE, handleTabChange as EventListener);
        };
    }, [tabs.tabsRef.current]);
}

function useCodeSampleScroll() {
    const codeSampleAnalytics = useCodeSampleAnalytics();
    const ux = useUXEvents();
    
    useUXScrollDepth(codeSampleAnalytics.ref, {
        onDepthReached: (depth) => {
            if (depth === 100) {
                ux.docs.code.scroll_100({});
            }

            ux.docs.code.scroll_depth({
                depth: depth,
            });
        },
    });
}

