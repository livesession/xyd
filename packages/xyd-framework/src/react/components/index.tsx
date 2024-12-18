import React, {isValidElement} from "react";
import {useLocation} from "react-router";

import {
    UIBreadcrumb,

    UINavLinks
} from "@xyd/ui";
import {Toc, SubNav} from "@xyd/ui2"
import type {ITOC} from "@xyd/ui";

import {useBreadcrumbs, useNavLinks, useSettings, useSidebarGroups, useToC} from "../contexts";
import {FwSidebarGroup, FwSidebarGroupContext} from "./sidebar";
import {Nav} from "@xyd/ui2";

import {manualHydration} from "../utils/manualHydration";
import {useMatchedSubNav} from "../hooks";

function FwNavLogo() {
    const settings = useSettings()

    const logo = isValidElement(settings?.styling?.logo) ? settings?.styling?.logo : manualHydration(settings?.styling?.logo)

    return logo
}

function isActive(l: string) {
    let ll = l.startsWith("/") ? l : "/" + l

    if (typeof window !== "undefined") {
        return window.location.pathname.startsWith(ll)
    }

    return false // TODO: ssr
}

function FwNav({kind}: { kind?: "middle" }) {
    const settings = useSettings()
    const location = useLocation()

    const active = settings?.structure?.header?.find(item => isActive(item.url || ""))

    return <Nav
        value={active?.url || ""}
        kind={kind}
        logo={<FwNavLogo/>}
        onChange={() => {
        }}
    >
        {
            settings?.structure?.header?.map((item, index) => {
                return <Nav.Item
                    key={index + (item.url || "") + item.name}
                    href={item?.url || ""}
                    value={item.url}
                >
                    {item.name}
                </Nav.Item>
            })
        }
    </Nav>
}

function FwSubNav() {
    const matchedSubnav = useMatchedSubNav()
    const location = useLocation()

    if (!matchedSubnav) {
        return null
    }

    const active = matchedSubnav?.items.find(item => location.pathname.startsWith(item.url || ""))

    // TODO: value
    return <SubNav
        title={matchedSubnav?.name}
        value={active?.url || ""}
        onChange={() => {
        }}
    >
        {matchedSubnav?.items.map((item, index) => {
            return <SubNav.Item value={item.url || ""} href={item.url}>
                {item.name}
            </SubNav.Item>
        })}
    </SubNav>

}

export interface FwSidebarGroupsProps {
    onePathBehaviour?: boolean
    clientSideRouting?: boolean
}

function FwSidebarGroups(props: FwSidebarGroupsProps) {
    const groups = useSidebarGroups()

    return <FwSidebarGroupContext
        onePathBehaviour={props.onePathBehaviour}
        clientSideRouting={props.clientSideRouting}
    >
        {
            groups?.map((group, index) => <FwSidebarGroup
                key={index + group.group}
                {...group}
            />)
        }
    </FwSidebarGroupContext>
}

type FlatTOC = {
    depth: number
    value: string
}

function FwToc() {
    const toc = useToC()

    if (!toc) {
        return null
    }

    const flatToc: FlatTOC[] = []

    const flatten = (toc?: ITOC[]) => {
        if (!toc) {
            return
        }

        toc.forEach(item => {
            flatToc.push({
                depth: item.depth,
                value: item.value
            })

            flatten(item.children)
        })
    }

    flatten(toc)

    // TODO: its temporary
    const tocFinal = flatToc.filter(item => item.depth === 2)

    const location = useLocation()

    // TODO: better in the future
    const defaultValue = location.hash ? location.hash.replace("#", "") : tocFinal[0]?.value

    return <Toc defaultValue={defaultValue}>
        {
            tocFinal.map((item, index) => <Toc.Item
                key={index + item.value + item.depth}
                value={item.value}
            >
                {item.value}
            </Toc.Item>)
        }
    </Toc>
}

// TODO: finish
function FwBreadcrumbs() {
    const breadcrumbs = useBreadcrumbs()

    return <UIBreadcrumb
        items={breadcrumbs || []}
    />
}

// TDOO: finish
function FwNavLinks() {
    const navlinks = useNavLinks()

    if (navlinks?.prev || navlinks?.next) {
        return <UINavLinks
            prev={navlinks.prev}
            next={navlinks.next}
        />
    }
    return null
}

export {
    FwNav,
    FwSubNav,

    FwBreadcrumbs,
    FwToc,
    FwNavLinks,

    FwSidebarGroups,

    useMatchedSubNav
}
