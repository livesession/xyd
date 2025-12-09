import { useState } from "react";
import * as Icons from "@livesession/design-system-icons";

import { Button, TextInput, Surface, SurfaceHeader, SurfaceScroll } from "~/components"

export async function clientLoader() { }
clientLoader.hydrate = true as const

export default function General() {
    const [domain, setDomain] = useState("");

    return <Surface surface="general">
        <SurfaceHeader
            title="General"
            description={<>Host the docs at your own domain</>}
            icon={Icons.SettingsIcon}
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