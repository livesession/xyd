import React from "react"

import { useSettings } from "@xyd-js/framework/react"

export function CheckSettingsExternal({ children }: { children: React.ReactNode }) {
    const settings = useSettings()

    console.log("CheckSettingsExternal", settings)
    return <div>
        {children}
    </div>
}