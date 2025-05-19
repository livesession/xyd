import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router";
import { UXAnalytics } from "openux-js";
import { plugAnalytics, type AnalyticsProvider, PlugAnalytics } from "pluganalytics"

import { Settings } from "@xyd-js/core";

interface XYDAnalyticsProps {
    children: React.ReactNode
    settings: Settings
    loader: any // TODO: types
}

interface XYDAnalyticsContextProps {
    analytics: PlugAnalytics
}

const XYDAnalyticsContext = createContext<XYDAnalyticsContextProps>({} as XYDAnalyticsContextProps)

export function XYDAnalytics({ children, settings, loader }: XYDAnalyticsProps) {
    const location = useLocation()
    const [plugAnalyticsInstance, setPlugAnalyticsInstance] = useState(() => plugAnalytics({ providers: [] }))

    async function loadAnalytics() {
        const providers = await loadAnalyticsModules(settings, loader)
        const validProviders = providers.filter(Boolean) as AnalyticsProvider[]
        const plug = plugAnalytics({ providers: validProviders })

        plug.page()
        setPlugAnalyticsInstance(plug)
    }

    // TODO: in the future better mechanism to load analytics - allow SSR
    useEffect(() => {
        loadAnalytics()
    }, [])

    useEffect(() => {
        plugAnalyticsInstance.page()
    }, [location.pathname])

    return <XYDAnalyticsContext
        value={{ analytics: plugAnalyticsInstance }}
    >
        <UXAnalytics analytics={plugAnalyticsInstance}>
            {children}
        </UXAnalytics>
    </XYDAnalyticsContext>
}


export function useAnalytics() {
    const ctx = useContext(XYDAnalyticsContext)

    return ctx.analytics
}

// TODO: better, more reusable loader
async function loadAnalyticsModules(
    settings: Settings,
    loader: any // TODO: types
) {
    const loadingProviderModules = Object.keys(settings?.integrations?.analytics || {}).map(async provider => {
        const providerOptions = settings?.integrations?.analytics?.[provider] || []
        const module = await loader(provider)
        if (!module) {
            console.error(`Cannot load provider ${provider} module`)

            return
        }

        if (Array.isArray(providerOptions)) {
            return module(...providerOptions)
        }

        return module(providerOptions)
    })

    const providerModules = await Promise.all(loadingProviderModules)

    return providerModules
}
