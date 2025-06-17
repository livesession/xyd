import { Settings } from "@xyd-js/core"
import { Plugin } from "@xyd-js/plugins"
import { SurfaceTarget } from "@xyd-js/framework/react"

import { SidebarItemRight } from "./SidebarItem"

export default function XydAtlasPlugin(): Plugin {
    return function (settings: Settings) {
        return {
            name: "atlas-xyd-plugin",
            customComponents: {
                AtlasSidebarItemRight: {
                    component: SidebarItemRight,
                    surface: SurfaceTarget.SidebarItemRight,
                }
            }
        }
    }
}