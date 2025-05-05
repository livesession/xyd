import React, { useState, lazy, Suspense, useEffect, useCallback } from "react"
import { createPortal } from 'react-dom'

const DocSearchModal = lazy(() => import('@docsearch/react').then(mod => ({ default: mod.DocSearchModal })));

import { SearchButton as XydSearchButton } from "@xyd-js/components/system"

import '@docsearch/css';
import { AlgoliaPluginOptions } from "./types";

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
            <$DocSearchModalWrapper isSearchOpen={isSearchOpen} onModalClosed={onModalClosed} />
        </Suspense>
    </>
}

function $DocSearchModalWrapper({ isSearchOpen, onModalClosed }: { isSearchOpen: boolean, onModalClosed: () => void }) {
    const [algoliaConfig, setAlgoliaConfig] = useState<AlgoliaPluginOptions | null>(null)

    async function loadData() {
        // @ts-ignore
        const algoliaDataModule = await import('virtual:xyd-plugin-algolia-data')

        setAlgoliaConfig(algoliaDataModule.default.config)
    }

    useEffect(() => {
        loadData()
    }, [])

    if (!algoliaConfig || !isSearchOpen) {
        return null
    }

    const docSearchModal = (
        <DocSearchModal
            appId={algoliaConfig?.appId || ""}
            apiKey={algoliaConfig?.apiKey || ""}
            indexName={algoliaConfig?.indexName || ""}
            onClose={onModalClosed}
            initialScrollY={0}
        />
    )

    return createPortal(docSearchModal, document.body);
}
