"use client"

import {SubNav} from "@primer/react-brand";

import {useActiveSection} from "@/app/hooks";

import navcn from "@/app/styles/SubNav.module.css";

export function HomeSubNav() {
    const activeSection = useActiveSection()

    return <div id="sub-nav" className={navcn.SubNavContainer}>
        <SubNav className={navcn.SubNav}>
            <SubNav.Link href="#home" aria-current={activeSection === 'home' ? 'page' : undefined}>
                | Home |
            </SubNav.Link>

            <SubNav.Link
                href="#developer-experience"
                aria-current={activeSection === 'developer-experience' ? 'page' : undefined}>
                Developer Experience
            </SubNav.Link>

            <SubNav.Link
                href="#built-in-standards"
                aria-current={activeSection === 'built-in-standards' ? 'page' : undefined}>
                Built-in Standards
            </SubNav.Link>

            <SubNav.Link
                href="#customization"
                aria-current={activeSection === 'customization' ? 'page' : undefined}>
                Customization
            </SubNav.Link>

            <SubNav.Link
                href="#ecosystem"
                aria-current={activeSection === 'ecosystem' ? 'page' : undefined}>
                Ecosystem
            </SubNav.Link>
        </SubNav>
    </div>
}