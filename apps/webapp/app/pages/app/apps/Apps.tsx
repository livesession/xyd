import * as Icons from "@livesession/design-system-icons";

import { Surface, SurfaceHeader, SurfaceScroll } from "~/components";

export async function clientLoader() { }
clientLoader.hydrate = true as const

export default function Apps() {
    return <>
        <Surface surface="apps">
            <SurfaceHeader
                title="Apps"
                description={<>Coming soon</>}
                icon={Icons.IntegrationsIcon}
            />
            <SurfaceScroll>
                <div>Coming soon</div>
            </SurfaceScroll>
        </Surface>
    </>
}