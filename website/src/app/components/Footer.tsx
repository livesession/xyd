"use client"

import {MinimalFooter} from "@cosmocss/land";

import {IconLiveSession} from "@/app/components/IconLiveSession";

export function Footer() {
    return <div id="footer">
        <MinimalFooter
            logo={<IconLiveSession fill="#fff"/>}
            logoHref="https://livesession.io"
            socialLinks={[]} // TODO: github in the future (need changes @cosmocss/land)
            copyrightStatement={<>
                Released under the MIT License. <br/>
                © 2025 LiveSession. All rights reserved.
            </>}
        />
    </div>
}