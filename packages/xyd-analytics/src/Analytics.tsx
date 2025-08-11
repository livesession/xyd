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

interface AnalyticsContextProps {
    analytics: PlugAnalytics
}

const AnalyticsContext = createContext<AnalyticsContextProps>({} as AnalyticsContextProps)

export function Analytics({ children, settings, loader }: XYDAnalyticsProps) {
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

    return <AnalyticsContext
        value={{ analytics: plugAnalyticsInstance }}
    >
        <UXAnalytics analytics={plugAnalyticsInstance}>
            {children}
        </UXAnalytics>
    </AnalyticsContext>
}

export function useAnalytics() {
    const ctx = useContext(AnalyticsContext)

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


        let options = providerOptions

        // TODO: in the future better API
        if (provider === "livesession") {
            options = providerOptions.trackId
        }

        if (Array.isArray(options)) {
            return module(...options)
        }

        return module(options)
    })

    const providerModules = await Promise.all(loadingProviderModules)

    return providerModules
}
