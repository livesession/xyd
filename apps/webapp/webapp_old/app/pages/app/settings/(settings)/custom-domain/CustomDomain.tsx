import { useState } from "react";
import * as Icons from "@livesession/design-system-icons";

import { Button, TextInput, Surface, SurfaceHeader, SurfaceScroll } from "~/components"

export async function clientLoader() { }
clientLoader.hydrate = true as const

export default function CustomDomain() {
    const [domain, setDomain] = useState("");

    return <Surface surface="custom-domain">
        <SurfaceHeader
            title="Custom domain setup"
            description={<>Host the docs at your own domain</>}
            icon={Icons.WebsiteIcon}
        />
        <SurfaceScroll>
            <TextInput
                type="text"
                label="Enter your domain URL"
                description="You can host your domain as a subdomain or a subdirectory"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
            />

            <Button>Save</Button>

        </SurfaceScroll>
    </Surface>
}