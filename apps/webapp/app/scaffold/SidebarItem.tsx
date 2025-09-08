import { useMatch, useNavigate } from "react-router"

import type { IconTypes } from "@livesession/design-system"
import { SidebarMenuItem } from "~/components"

interface SidebarItemProps {
    icon: IconTypes
    children: React.ReactNode
    route: string
}

export function SidebarItem(props: SidebarItemProps) {
    const { icon, children, route } = props

    const matches = useMatch(route)
    const navigate = useNavigate()

    return <SidebarMenuItem
        icon={icon}
        selected={!!matches}
        onClick={() => navigate(route)}>
        {children}
    </SidebarMenuItem>
}