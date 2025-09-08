import { Outlet } from "react-router"

import * as Icons from "@livesession/design-system-icons"

import { IconGitMerge } from "~/icons"
import { SidebarItem } from "~/scaffold/SidebarItem"
import { Sidebar, SidebarMenu, SidebarMenuList } from "~/components"

export async function clientLoader() { }
clientLoader.hydrate = true as const

export default function Settings() {
    return <>
        <_Sidebar />

        <Outlet />
    </>
}

function _Sidebar() {
    return <Sidebar resizable={true} changeContainerHeight={false}>
        <SidebarMenu>
            <SidebarMenuList header="Settings">
                <SidebarItem
                    icon={Icons.SettingsIcon}
                    route="/app/settings/general"
                >
                    General
                </SidebarItem>

                <SidebarItem
                    icon={Icons.WebsiteIcon}
                    route="/app/settings/custom-domain"
                >
                    Custom Domain
                </SidebarItem>

                <SidebarItem
                    icon={IconGitMerge}
                    route="/app/settings/git-settings"
                >
                    Git Settings
                </SidebarItem>
            </SidebarMenuList>
        </SidebarMenu>
    </Sidebar>
}
