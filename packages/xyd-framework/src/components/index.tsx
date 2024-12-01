import React, {isValidElement, useContext} from "react";
import {
    HNavItem,
    HNavLogo,

    HToc,
    HTocItem,
    HTocMeta,

    HBreadcrumb,

    HNavLinks
} from "@xyd/ui/headless";
import {ITOC} from "@xyd/ui";

import {useBreadcrumbs, useNavLinks, useSettings, useSidebarGroups, useToC} from "../contexts";
import {FwSidebarGroup, FwSidebarGroupContext} from "./sidebar";
import {UIContext} from "../contexts/ui";

// TODO: !!! THIS SHOULD BE DONE AT DIFFERENT LEVEL !!!
function manualHydration(obj: any, key = 0): React.ReactElement | null {
    if (typeof obj !== 'object' || obj === null) {
        return null;
    }

    const {type, props} = obj || {};
    if (typeof type !== 'string' && typeof type !== 'function') {
        return null;
    }

    let children = []
    if (props?.children?.map && typeof props?.children?.map === "function") {
        children = props?.children?.map((child: any, i) => manualHydration(child, key + i)) || []
    }

    return React.createElement(type, {...props, children, key});
}

function FwNavLogo() {
    const settings = useSettings()

    const logo = isValidElement(settings?.styling?.logo) ? settings?.styling?.logo : manualHydration(settings?.styling?.logo)

    return <HNavLogo>
        {logo}
    </HNavLogo>
}

function isActive(l: string) {
    let ll = l.startsWith("/") ? l : "/" + l

    if (typeof window !== "undefined") {
        return window.location.pathname.startsWith(ll)
    }

    return false // TODO: ssr
}

function FwTopbarLinks() {
    const settings = useSettings()

    const uiContext = useContext(UIContext)

    return settings?.structure?.topbarLinks?.map((item, index) => {
        return <HNavItem
            key={index + (item.url || "") + item.name}
            href={item?.url || ""}
            active={isActive(item.url || "")}
        >
            {item.name}
        </HNavItem>
    })
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
            groups.map((group, index) => <FwSidebarGroup
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

// TODO: finish
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

    // TODO: title + meta
    return <HToc
        title=""
        meta={<></>}
    >
        <>
            {
                flatToc.map((item, index) => <HTocItem
                    key={index + item.value + item.depth}
                    // @ts-ignore !!! TODO !!!
                    depth={item.depth}
                    href=""
                >
                    {item.value}
                </HTocItem>)
            }
        </>
    </HToc>
}

// TODO: finish
function FwBreadcrumbs() {
    const breadcrumbs = useBreadcrumbs()

    return <HBreadcrumb
        items={breadcrumbs || []}
    />
}

// TDOO: finish
function FwNavLinks() {
    const navlinks = useNavLinks()

    if (navlinks?.prev || navlinks?.next) {
        return <HNavLinks
            prev={navlinks.prev}
            next={navlinks.next}
        />
    }
    return null
}

export {
    FwNavLogo,
    FwTopbarLinks,
    FwSidebarGroups,
    FwToc,
    FwBreadcrumbs,
    FwNavLinks
}

export {
    FwHead
} from "./head"
