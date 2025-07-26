"use client"

import {SubdomainNavBar} from "@cosmocss/land";
import {MarkGithubIcon} from "@primer/octicons-react";

import {IconLiveSession} from "@/app/components/index";

export function Header() {
    return <SubdomainNavBar
        logoHref="https://livesession.io"
        logo={<IconLiveSession fill="#fff"/>}
        // @ts-ignore
        title={<code>xyd</code>}
        fixed={false}
    >
        <SubdomainNavBar.Link href="#">Guide</SubdomainNavBar.Link>
        <SubdomainNavBar.Link href="#">Reference</SubdomainNavBar.Link>
        <SubdomainNavBar.SecondaryAction
            // @ts-ignore
            target="_blank"
            href="https://github.com/livesession/xyd"
            trailingVisual={<MarkGithubIcon/>}
        >
            <>Star us on</>
        </SubdomainNavBar.SecondaryAction>
    </SubdomainNavBar>
}