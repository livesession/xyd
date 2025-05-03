import React, { useState, lazy, Suspense, useEffect, useCallback } from "react"
import { createPortal } from 'react-dom'
import { create, insertMultiple } from '@orama/orama'

const OramaSearchBox = lazy(() => import('@orama/react-components').then(mod => ({ default: mod.OramaSearchBox })));

import { SearchButton as XydSearchButton } from "@xyd-js/components/system"

export function SearchButton() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const handleClick = useCallback(() => {
        if (isSearchOpen) {
            return
        }

        setIsSearchOpen(true)
    }, [])

    const onModalClosed = useCallback(() => {
        setIsSearchOpen(false)
    }, [])

    return <>
        <XydSearchButton onClick={handleClick} />

        <Suspense>
            <$OramaSearchBoxWrapper isSearchOpen={isSearchOpen} onModalClosed={onModalClosed} />
        </Suspense>
    </>
}


function $OramaSearchBoxWrapper({ isSearchOpen, onModalClosed }: { isSearchOpen: boolean, onModalClosed: () => void }) {
    const [oramaLocalClientInstance, setOramaLocalClientInstance] = useState<any>(null);
    const [pluginOptions, setPluginOptions] = useState<any>(null);

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
                api_key: pluginOptions.cloudConfig.api_key
            }}
            disableChat={!pluginOptions?.cloudConfig}
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
        }
    })

    await insertMultiple(db, oramaDocs as any)

    return db
}