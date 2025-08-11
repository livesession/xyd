import React, { useState, lazy, Suspense, useEffect, useCallback, useRef } from "react"
import { createPortal } from 'react-dom'
import { create, insertMultiple } from '@orama/orama'

import {
    useColorScheme
} from "@xyd-js/components/writer";
import { SearchButton } from "@xyd-js/components/system"
import { useUXEvents } from "@xyd-js/analytics"

const OramaSearchBox = lazy(() => import('@orama/react-components').then(mod => ({ default: mod.OramaSearchBox })));

export default function OramaSearch() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const ux = useUXEvents()

    const handleClick = useCallback(() => {
        if (isSearchOpen) {
            return
        }

        ux.docs.search.open({})
        setIsSearchOpen(true)
    }, [])

    const onModalClosed = useCallback(() => {
        setIsSearchOpen(false)
    }, [])

    return <>
        <SearchButton onClick={handleClick} />

        <Suspense>
            <$OramaSearchBoxWrapper isSearchOpen={isSearchOpen} onModalClosed={onModalClosed} />
        </Suspense>
    </>
}

function $OramaSearchBoxWrapper({ isSearchOpen, onModalClosed }: { isSearchOpen: boolean, onModalClosed: () => void }) {
    const [oramaLocalClientInstance, setOramaLocalClientInstance] = useState<any>(null);
    const [pluginOptions, setPluginOptions] = useState<any>(null);
    const [colorScheme] = useColorScheme()
    const ux = useUXEvents()
    const uxTyping = useUXTyping((term: string) => {
        ux.docs.search.query_change({
            term: term
        })
    })

    async function loadData() {
        // @ts-ignore
        const oramaDataModule = await import('virtual:xyd-plugin-orama-data')

        const oramaDocs = oramaDataModule.default.docs
        const oramaCloudConfig = oramaDataModule.default.cloudConfig || null
        const oramaSuggestions = oramaDataModule.default.suggestions || []

        if (oramaCloudConfig) {
            setPluginOptions({
                cloudConfig: oramaCloudConfig,
                suggestions: oramaSuggestions
            })
            return
        }

        const db = await createOramaInstance(oramaDocs)

        setOramaLocalClientInstance(db)
        setPluginOptions({
            suggestions: oramaSuggestions
        })
    }

    useEffect(() => {
        loadData()
    }, [])

    if (!isSearchOpen) return null;

    const searchBox = (oramaLocalClientInstance || pluginOptions?.cloudConfig) ? (
        <OramaSearchBox
            colorScheme={colorScheme || "system"}
            open={isSearchOpen}
            clientInstance={oramaLocalClientInstance}
            onModalClosed={onModalClosed}
            suggestions={pluginOptions.suggestions}
            highlightTitle={{
                caseSensitive: false,
                HTMLTag: 'b',
            }}
            highlightDescription={{
                caseSensitive: false,
                HTMLTag: 'b',
            }}
            index={pluginOptions?.cloudConfig && {
                endpoint: pluginOptions.cloudConfig.endpoint,
                api_key: pluginOptions.cloudConfig.apiKey
            }}
            disableChat={!pluginOptions?.cloudConfig}
            onSearchResultClick={(resp) => {
                const result = resp.detail.result

                ux.docs.search.result_click({
                    title: result.title,
                    description: result.description,
                })
            }}
            onSearchCompleted={(resp) => {
                const term = resp.detail.clientSearchParams?.term
                uxTyping(term)
            }}
        />
    ) : null;


    return createPortal(searchBox, document.body);
}

async function createOramaInstance(oramaDocs: any[]): Promise<any> {
    const db = create({
        schema: {
            category: "string",
            path: "string",
            title: "string",
            description: "string",
            content: "string"
        },
        plugins: [
            //    TODO: finish pluganalytics
        ]
    })

    await insertMultiple(db, oramaDocs as any)

    return db
}

// TODO: move to uxsdk
function useUXTyping(callback: (term: string) => void, delay: number = 500) {
    const timeoutRef = useRef<number | null>(null)
    const lastTermRef = useRef<string>('')

    const trackTyping = useCallback((term?: any) => {
        // Only track if term has actually changed and is a valid string
        if (term && typeof term === 'string' && term !== lastTermRef.current) {
            // Clear existing timeout only when term changes
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
            lastTermRef.current = term
            
            timeoutRef.current = window.setTimeout(() => {
                if (term.trim()) {
                    callback(term.trim())
                }
            }, delay)
        }
    }, [callback, delay])

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    return trackTyping
}