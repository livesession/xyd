import { Outlet } from "react-router"

import * as Icons from "@livesession/design-system-icons"

import { useAuth } from "~/contexts/AuthContext"
import { Layout, Dock, DockList } from "~/components"
import { Scaffold } from "~/scaffold"

export async function clientLoader() { }
clientLoader.hydrate = true as const

export default function App() {
    const { signOut } = useAuth()

    return <Layout>
        <Dock showLogo logoHref="/">
            <DockList>
                <Scaffold.DockItem icon={Icons.HomeIcon} route="/app/home" />
                <Scaffold.DockItem icon={Icons.EditIcon} route="/app/editor" />
                <Scaffold.DockItem icon={Icons.SettingsIcon} route="/app/settings" />
                <Scaffold.DockItem icon={Icons.IntegrationsIcon} route="/app/apps" />
            </DockList>
            <DockList bottom>
                <Scaffold.DockItem icon={Icons.BookIcon} route={null} href="https://xyd.dev" />
                <Scaffold.DockItem icon={Icons.LogoutIcon} route={null} onClick={signOut} />
            </DockList>
        </Dock>
        <Outlet />
    </Layout>
}

