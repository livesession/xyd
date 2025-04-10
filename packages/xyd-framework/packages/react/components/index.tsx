import React, {isValidElement} from "react";
import {useLocation} from "react-router";

import type {ITOC} from "@xyd-js/ui";
import {Breadcrumbs, NavLinks} from "@xyd-js/components/writer";
import {Toc, SubNav, UISidebar, Nav} from "@xyd-js/ui"

import {useBreadcrumbs, useNavLinks, useSettings, useSidebarGroups, useToC} from "../contexts";
import {FwSidebarItemGroup, FwSidebarGroupContext, FwSidebarItemProps} from "./Sidebar";

import {manualHydration} from "../utils/manualHydration";
import {useMatchedSubNav} from "../hooks";

function FwNavLogo() {
    const settings = useSettings()

    const logo = isValidElement(settings?.theme?.logo) ? settings?.theme?.logo : manualHydration(settings?.theme?.logo)

    // TODO: configurable url?
    return <a href="/">
        {logo}
    </a>
}

function FwNav({kind}: { kind?: "middle" }) {
    const matchedSubnav = useMatchedSubNav()
    const location = useLocation()

    const settings = useSettings()

    const headers = matchedSubnav ? matchedSubnav?.items : settings?.navigation?.header
    const active = headers?.find(item => location.pathname.startsWith(item.url || ""))

    return <Nav
        value={active?.url || ""}
        kind={kind}
        logo={<FwNavLogo/>}
        onChange={() => {
        }}
    >
        {
            settings?.navigation?.header?.map((item, index) => {
                if (item.sub) {
                    return null
                }
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

    // TODO: in the future routing props from settings like {match: "/docs/api/browser"}
    const active = matchedSubnav?.items.findLast(item => location.pathname.startsWith(item.url || ""))

    // TODO: value
    return <SubNav
        title={matchedSubnav?.name || ""}
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

function recursiveSearch(items: FwSidebarItemProps[], href: string, levels: any[] = []) {
    for (let i = 0; i < items.length; i++) {
        const item = items[i]

        if (item.href === href) {
            return [...levels, i]
        }

        if (item.items) {
            const result = recursiveSearch(item.items, href, [...levels, i])
            if (result) {
                return result
            }
        }
    }
    return null
}

function FwSidebarGroups(props: FwSidebarGroupsProps) {
    const groups = useSidebarGroups()

    const settings = useSettings()

    const footerItems = settings.navigation?.anchors?.bottom?.map(anchor => {
        let icon

        // TODO: refactor this !!!
        if (typeof anchor.icon === "string") {
            switch (anchor.icon) {
                case "icon-cookbook": {
                    icon = <IconCookbook/>
                    break
                }

                case "icon-community": {
                    icon = <IconCommunity/>
                    break
                }

                case "icon-marketplace": {
                    icon = <IconMarketplace/>
                    break
                }

                case "icon-sdk": {
                    icon = <IconSDK/>
                    break
                }

                default: {
                    icon = null
                }
            }
        } else {
            icon = isValidElement(anchor.icon) ? anchor.icon : manualHydration(anchor.icon)
        }

        return <UISidebar.FooterItem href={anchor.url} icon={icon}>
            {anchor.name}
        </UISidebar.FooterItem>
    })

    const location = useLocation()
    const initialActiveItems: any[] = []
    groups.forEach(group => {
        const activeLevels = recursiveSearch(group.items, location.pathname) || []

        activeLevels.reduce((acc, index) => {
            initialActiveItems.push(acc[index])
            acc[index].active = true
            return acc[index].items
        }, group.items)

        return group
    })

    return <FwSidebarGroupContext
        onePathBehaviour={props.onePathBehaviour}
        clientSideRouting={props.clientSideRouting}
        initialActiveItems={initialActiveItems}
    >
        <UISidebar footerItems={footerItems && footerItems}>
            {
                groups?.map((group, index) => <FwSidebarItemGroup
                    key={index + group.group}
                    {...group}
                />)
            }
        </UISidebar>
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

function FwBreadcrumbs() {
    const breadcrumbs = useBreadcrumbs()

    return <Breadcrumbs
        items={breadcrumbs || []}
    />
}

function FwNavLinks() {
    const navlinks = useNavLinks()

    if (navlinks?.prev || navlinks?.next) {
        return <NavLinks
            prev={navlinks.prev}
            next={navlinks.next}
        />
    }

    return null
}

// TODO: issues with below svgs inside settigns - REFACTOR THIS
function IconCookbook() {
    return <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="1em"
        height="1em"
    >
        <path
            fillRule="evenodd"
            d="M14.447 7.106a1 1 0 0 1 .447 1.341l-4 8a1 1 0 1 1-1.788-.894l4-8a1 1 0 0 1 1.341-.447ZM6.6 7.2a1 1 0 0 1 .2 1.4L4.25 12l2.55 3.4a1 1 0 0 1-1.6 1.2l-3-4a1 1 0 0 1 0-1.2l3-4a1 1 0 0 1 1.4-.2Zm10.8 0a1 1 0 0 1 1.4.2l3 4a1 1 0 0 1 0 1.2l-3 4a1 1 0 0 1-1.6-1.2l2.55-3.4-2.55-3.4a1 1 0 0 1 .2-1.4Z"
            clipRule="evenodd"
        />
    </svg>
}

function IconCommunity() {
    return <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 24 24"
        width="1em"
        height="1em"
    >
        <path
            fillRule="evenodd"
            d="M10.5 8.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM12 5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM3 9.5a1 1 0 1 1 2 0 1 1 0 0 1-2 0Zm1-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm16 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm-3 1a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM8 18c0-.974.438-1.684 1.142-2.185C9.876 15.293 10.911 15 12 15c1.09 0 2.124.293 2.858.815.704.5 1.142 1.21 1.142 2.185a1 1 0 1 0 2 0c0-1.692-.812-2.982-1.983-3.815C14.876 13.373 13.411 13 12 13c-1.41 0-2.876.373-4.017 1.185C6.812 15.018 6 16.308 6 18a1 1 0 1 0 2 0Zm-3.016-3.675a1 1 0 0 1-.809 1.16C2.79 15.732 2 16.486 2 17.5a1 1 0 1 1-2 0c0-2.41 1.978-3.655 3.825-3.985a1 1 0 0 1 1.16.81Zm14.84 1.16a1 1 0 1 1 .351-1.97C22.022 13.845 24 15.09 24 17.5a1 1 0 1 1-2 0c0-1.014-.79-1.768-2.175-2.015Z"
            clipRule="evenodd"
        />
    </svg>
}

// TODO: but this svg works on settings
function IconMarketplace() {
    return <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        width="1em"
        height="1em"
    >
        <path fill-rule="evenodd" clip-rule="evenodd"
              d="M3.78163 3.28449C3.8768 2.96725 4.16879 2.75 4.5 2.75H19.5C19.8312 2.75 20.1232 2.96725 20.2184 3.28449L21.7184 8.28449C21.7393 8.3544 21.75 8.42701 21.75 8.5C21.75 10.5711 20.0711 12.25 18 12.25C16.7733 12.25 15.6842 11.661 15 10.7504C14.3158 11.661 13.2267 12.25 12 12.25C10.7733 12.25 9.68417 11.661 9 10.7504C8.31583 11.661 7.2267 12.25 6 12.25C3.92893 12.25 2.25 10.5711 2.25 8.5C2.25 8.42701 2.26066 8.3544 2.28163 8.28449L3.78163 3.28449ZM9.75 8.5C9.75 9.74264 10.7574 10.75 12 10.75C13.2426 10.75 14.25 9.74264 14.25 8.5C14.25 8.08579 14.5858 7.75 15 7.75C15.4142 7.75 15.75 8.08579 15.75 8.5C15.75 9.74264 16.7574 10.75 18 10.75C19.2083 10.75 20.1942 9.79754 20.2477 8.60244L18.942 4.25H5.05802L3.75229 8.60244C3.80584 9.79753 4.79169 10.75 6 10.75C7.24264 10.75 8.25 9.74264 8.25 8.5C8.25 8.08579 8.58579 7.75 9 7.75C9.41421 7.75 9.75 8.08579 9.75 8.5Z"
        />
        <path fill-rule="evenodd" clip-rule="evenodd"
              d="M4 10.25C4.41421 10.25 4.75 10.5858 4.75 11V19.75H6.5C6.91421 19.75 7.25 20.0858 7.25 20.5C7.25 20.9142 6.91421 21.25 6.5 21.25H4C3.58579 21.25 3.25 20.9142 3.25 20.5V11C3.25 10.5858 3.58579 10.25 4 10.25ZM20 10.25C20.4142 10.25 20.75 10.5858 20.75 11V20.5C20.75 20.9142 20.4142 21.25 20 21.25H10.5C10.0858 21.25 9.75 20.9142 9.75 20.5C9.75 20.0858 10.0858 19.75 10.5 19.75H19.25V11C19.25 10.5858 19.5858 10.25 20 10.25Z"
        />
        <path
            d="M12.003 19C11.31 18.9996 10.6384 18.7598 10.102 18.3213C9.56564 17.8829 9.19745 17.2726 9.05983 16.594C8.92222 15.9154 9.02364 15.2101 9.34693 14.5976C9.67022 13.9852 10.1955 13.5032 10.8337 13.2333C11.5673 12.9262 12.393 12.9221 13.1296 13.2222C13.8661 13.5222 14.4536 14.1018 14.7631 14.8338C15.0727 15.5659 15.0791 16.3907 14.7808 17.1274C14.4827 17.8642 13.9042 18.4527 13.1724 18.7641C12.8025 18.9205 12.4047 19.0007 12.003 19ZM11.1458 14.7215C11.1124 14.7215 11.0803 14.7348 11.0567 14.7584C11.0331 14.782 11.0198 14.8141 11.0198 14.8475V17.1923C11.0198 17.2258 11.0331 17.2578 11.0567 17.2814C11.0803 17.305 11.1124 17.3183 11.1458 17.3183C11.1671 17.3183 11.188 17.3128 11.2065 17.3024L13.3399 16.13C13.3597 16.1192 13.3761 16.1032 13.3876 16.0838C13.3991 16.0644 13.4052 16.0423 13.4052 16.0197C13.4052 15.9972 13.3991 15.9751 13.3876 15.9557C13.3761 15.9362 13.3597 15.9203 13.3399 15.9094L11.2063 14.7373C11.1879 14.727 11.1671 14.7215 11.1458 14.7215Z"
        />
    </svg>
}

function IconSDK() {
    return <svg
        viewBox="0 0 15 15"
        xmlns="http://www.w3.org/2000/svg"
        width="1em"
        height="1em"
    >
        <path
            d="M7.28856 0.796908C7.42258 0.734364 7.57742 0.734364 7.71144 0.796908L13.7114 3.59691C13.8875 3.67906 14 3.85574 14 4.05V10.95C14 11.1443 13.8875 11.3209 13.7114 11.4031L7.71144 14.2031C7.57742 14.2656 7.42258 14.2656 7.28856 14.2031L1.28856 11.4031C1.11252 11.3209 1 11.1443 1 10.95V4.05C1 3.85574 1.11252 3.67906 1.28856 3.59691L7.28856 0.796908ZM2 4.80578L7 6.93078V12.9649L2 10.6316V4.80578ZM8 12.9649L13 10.6316V4.80578L8 6.93078V12.9649ZM7.5 6.05672L12.2719 4.02866L7.5 1.80176L2.72809 4.02866L7.5 6.05672Z"
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
        />
    </svg>
}

export {
    FwNav,
    FwSubNav,

    FwBreadcrumbs,
    FwToc,
    FwNavLinks,

    FwSidebarGroups,
}
