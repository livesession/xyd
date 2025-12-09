import { lazy } from "react"
import { useMatches, useNavigate } from "react-router"

import type { IconTypes } from "@livesession/design-system"
const DockMenuItem = lazy(() => import("@livesession/design-system/app-ui").then(module => ({ default: module.Dock.MenuItem })))

interface DockItemProps {
    icon: IconTypes
    route: string | null
    href?: string
    onClick?: () => void
}

export function DockItem(props: DockItemProps) {
    const { icon, route, href, onClick } = props

    const matches = useMatches()
    const navigate = useNavigate()

    const selected = matches.find(match => match.pathname === route)

    return <DockMenuItem
        icon={icon}
        selected={!!selected}
        onClick={onClick ? onClick : route ? () => navigate(route) : undefined}
        href={href}
    />
}