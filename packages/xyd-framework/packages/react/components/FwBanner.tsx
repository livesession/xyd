import React from "react"

import { Banner } from "@xyd-js/components/writer"

import { useBannerContent, useSettings } from "../contexts/framework"

export function FwBanner() {
    const BannerContent = useBannerContent()
    const settings = useSettings()

    const BannerComponent = settings?.webeditor?.banner?.kind === "secondary" ? Banner.Secondary : Banner

    if (!BannerContent) {
        return null
    }

    return <BannerComponent
        label={settings?.webeditor?.banner?.label}
        icon={settings?.webeditor?.banner?.icon}
        href={settings?.webeditor?.banner?.href}
    >
        <BannerContent />
    </BannerComponent>
}