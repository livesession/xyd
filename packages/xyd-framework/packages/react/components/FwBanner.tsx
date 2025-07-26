import React from "react"

import { Banner } from "@xyd-js/components/writer"

import { useBannerContent, useSettings } from "../contexts/framework"

export function FwBanner() {
    const BannerContent = useBannerContent()
    const settings = useSettings()

    const BannerComponent = settings?.components?.banner?.kind === "secondary" ? Banner.Secondary : Banner

    if (!BannerContent) {
        return null
    }

    return <BannerComponent
        label={settings?.components?.banner?.label}
        icon={settings?.components?.banner?.icon}
        href={settings?.components?.banner?.href}
    >
        <BannerContent />
    </BannerComponent>
}