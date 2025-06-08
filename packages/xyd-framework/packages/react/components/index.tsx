import React, {isValidElement, useState} from "react";
import {Link, useLocation, useMatches, type To} from "react-router";

import {Header} from "@xyd-js/core";
import type {ITOC} from "@xyd-js/ui";
import {Breadcrumbs, NavLinks, Anchor, Button, Icon} from "@xyd-js/components/writer";
import {Toc, SubNav, UISidebar, Nav} from "@xyd-js/ui"
import {useEvents} from "@xyd-js/analytics"

import {Surface} from "./Surfaces";

import {
    useBreadcrumbs,
    useNavLinks,
    useRawPage,
    useSettings,
    useSidebarGroups,
    useToC
} from "../contexts";
import {FwSidebarItemGroup, FwSidebarGroupContext, FwSidebarItemProps} from "./Sidebar";

import {useMatchedSubNav} from "../hooks";

function FwNavLogo() {
    const settings = useSettings()

    const logo = typeof settings?.theme?.logo === "string" ? settings?.theme?.logo : undefined

    if (!logo) {
        return null
    }

    return <a href="/">
        <img part="logo" src={logo}/>
    </a>
}

export function FwNav({kind}: { kind?: "middle" }) {
    const matches = useMatches()
    const matchedSubnav = useMatchedSubNav()
    const settings = useSettings()

    const lastMatch = matches[matches.length - 1]

    const header = settings?.navigation?.header || []

    const active = header.find(item => {
        if (matchedSubnav) {
            return item.url?.startsWith(matchedSubnav?.route || "")
        }

        return item.url === lastMatch?.id
    })

    function createHeader(item: Header) {
        return <Nav.Item
            key={(item.url || "") + item.name}
            href={item?.url || ""}
            value={item.url || ""}
            as={$Link}
        >
            {item.name}
        </Nav.Item>
    }

    const headerMap = header.reduce<Record<string, React.ReactNode[]>>((acc, item) => {
        const float = item.float || "default";
        return {
            ...acc,
            [float]: [...(acc[float] || []), createHeader(item)]
        };
    }, {});

    const rightHeaderExists = headerMap["right"]?.length > 0

    // TODO: in the future better floating system - just pure css?
    return <Nav
        value={active?.url || ""}
        kind={kind}
        logo={<FwNavLogo/>}
        rightSurface={<>
            {
                rightHeaderExists
                    ? <Nav.Tab
                        value={active?.url || ""}
                    >
                        {headerMap["right"]}
                    </Nav.Tab>
                    : null
            }

            <Surface target="nav.right"/>
        </>}
    >
        {headerMap["default"]}
    </Nav>
}

export function FwSubNav() {
    const matchedSubnav = useMatchedSubNav()
    const location = useLocation()
    const pathname = trailingSlash(location.pathname)

    if (!matchedSubnav) {
        return null
    }

    // TODO: in the future routing props from settings like {match: "/docs/api/browser"}
    const active = matchedSubnav?.items.findLast(item => pathname.startsWith(item.url || ""))

    // TODO: value
    return <SubNav
        title={matchedSubnav?.name || ""}
        value={active?.url || ""}
        onChange={() => {
        }}
    >
        {matchedSubnav?.items.map((item, index) => {
            return <SubNav.Item
                value={item.url || ""}
                href={item.url}
                as={$Link}

            >
                {item.name}
            </SubNav.Item>
        })}
    </SubNav>
}

export interface FwSidebarGroupsProps {
}

export function FwSidebarGroups(props: FwSidebarGroupsProps) {
    const location = useLocation()
    const pathname = trailingSlash(location.pathname)
    const groups = useSidebarGroups()
    const settings = useSettings()

    const footerItems = settings.navigation?.anchors?.bottom?.map(anchor => {
        return <UISidebar.FooterItem href={anchor.url} icon={<Icon name={anchor.icon || ""}/>}>
            {anchor.name}
        </UISidebar.FooterItem>
    })

    const initialActiveItems: any[] = []
    groups.forEach((group, groupIndex) => {
        const activeLevels = recursiveSearch(group.items, pathname) || []

        activeLevels.reduce((acc, index, level) => {
            initialActiveItems.push({
                ...acc[index],
                groupIndex: groupIndex,
                level: level,
                itemIndex: index,
            })
            acc[index].active = true
            return acc[index].items
        }, group.items)

        return group
    })

    // TODO: better API for elements like logo search
    return <FwSidebarGroupContext
        initialActiveItems={initialActiveItems}
    >
        <UISidebar footerItems={footerItems && footerItems}>
            <Surface target="sidebar.top"/>

            {
                groups?.map((group, index) => <FwSidebarItemGroup
                    key={index + group.group}
                    {...group}
                    groupIndex={index}
                />)
            }
        </UISidebar>
    </FwSidebarGroupContext>
}

export function FwToc() {
    const toc = useToC()

    if (!toc) {
        return null
    }

    let maxDepth = 2

    const renderTocItems = (items: Readonly<ITOC[]>, depth: number = 0) => {
        if (depth > maxDepth) {
            maxDepth = depth
        }

        return items.map((item) => (
            <React.Fragment key={item.id}>
                <Toc.Item
                    id={item.id}
                    depth={depth}
                >
                    {item.value}
                </Toc.Item>
                {item.children && item.children.length > 0 && renderTocItems(item.children, depth + 1)}
            </React.Fragment>
        ))
    }

    return <Toc maxDepth={maxDepth}>
        {renderTocItems(toc)}
    </Toc>
}

export function FwBreadcrumbs() {
    const fwBreadcrumbs = useBreadcrumbs()

    const breadcrumbs = fwBreadcrumbs?.map(item => ({
        title: item.title,
        href: item.href
    }))

    return <Breadcrumbs
        items={breadcrumbs || []}
    />
}

export function FwNavLinks() {
    const navlinks = useNavLinks()

    if (navlinks?.prev || navlinks?.next) {
        return <NavLinks
            prev={navlinks.prev}
            next={navlinks.next}
            as={$Link}
        />
    }

    return null
}

export function FwLogo() {
    const settings = useSettings()

    if (typeof settings?.theme?.logo === "string") {
        return <img src={settings?.theme?.logo}/>
    }

    if (isValidElement(settings?.theme?.logo)) {
        return <a href="/">
            {settings?.theme?.logo}
        </a>
    }

    return null
}

export function FwLink({children, ...rest}) {
    return <Anchor {...rest} as={$Link}>
        {children}
    </Anchor>
}

export function FwCopyPage() {
    const [isCopied, setIsCopied] = useState(false)

    const rawPage = useRawPage()
    // const events = useEvents()

    const handleCopy = () => {
        navigator.clipboard.writeText(rawPage || "")
        setIsCopied(true)
        // events.CopyPage({}) TODO: finish this

        setTimeout(() => setIsCopied(false), 2000)
    }

    // TODO: `xyd` icons must be always loaded
    return <Button icon={isCopied ? <Icon name="check" size={12}/> : <Icon name="copy" size={12}/>} onClick={handleCopy}>
        Copy page
    </Button>
}

function $Link({children, ...rest}) {
    let to: To = ""

    if (rest.href) {
        try {
            new URL(rest.href)
            to = rest.href
        } catch (error) {
            if (rest.href.startsWith("/")) {
                const url = new URL(`https://example.com${rest.href}`)
                to = {
                    pathname: url.pathname,
                    search: url.search,
                    hash: url.hash,
                }
            } else {
                return <Anchor as="button" onClick={() => { // TODO: !!! in the future we should use react-router but it rerenders tha page !!!
                    const url = new URL(window.location.href)
                    const currentParams = url.searchParams

                    // Update parameters from the new params
                    new URLSearchParams(rest.href).forEach((value, key) => {
                        currentParams.set(key, value)
                    })

                    url.search = currentParams.toString()
                    history.replaceState(null, '', url)
                }}>
                    {children}
                </Anchor>
            }
        }
    }

    return <Link {...rest} to={to}>
        {children}
    </Link>
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


function trailingSlash(path: string) {
    return path.endsWith("/") ? path.slice(0, -1) : path
}