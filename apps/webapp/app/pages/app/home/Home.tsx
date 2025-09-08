import { useState } from "react";

import * as Icons from "@livesession/design-system-icons";

import {
    Button,
    TextInput,
    Sidebar,
    Surface,
    SurfaceHeader,
    SurfaceScroll,
    SidebarMenu,
    SidebarMenuList,
    SidebarMenuItem
} from "~/components";

export default function Home() {
    return <>
        <_Sidebar />
        <_Surface />
    </>
}

function _Surface() {
    const [domain, setDomain] = useState("");

    return <Surface surface="general">
        <SurfaceHeader
            title="Home"
            icon={Icons.HomeIcon}
        />
        <SurfaceScroll>
            <TextInput
                type="text"
                label="Project name"
                description="Name displayed on the topbar"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
            />

            <Button>Save</Button>

        </SurfaceScroll>
    </Surface>
}

function _Sidebar() {
    return <Sidebar resizable={true} changeContainerHeight={false}>
        <SidebarMenu>
            <SidebarMenuList header="Home">
                <SidebarMenuItem
                    icon={Icons.BrowserIcon}
                >
                    Visit docs
                </SidebarMenuItem>
            </SidebarMenuList>
        </SidebarMenu>
    </Sidebar>
}
