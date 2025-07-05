import React, { isValidElement, useState } from "react";
import { Link, type To, useLocation, useMatches } from "react-router";

import { Header } from "@xyd-js/core";
import type { ITOC } from "@xyd-js/ui";
import { Nav, SubNav, Toc, UISidebar } from "@xyd-js/ui"
import { Anchor, Breadcrumbs, Button, ColorSchemeButton, Icon, NavLinks, useColorScheme } from "@xyd-js/components/writer";
import { SidebarTabsDropdown } from "@xyd-js/ui";
import * as Components from "@xyd-js/components/writer";

import { Surface } from "./Surfaces";
import { SurfaceTarget } from "../../../src";

import { useBreadcrumbs, useMetadata, useNavLinks, useRawPage, useSettings, useSidebarGroups, useToC } from "../contexts";
import { FwSidebarGroupContext, FwSidebarItemGroup, FwSidebarItemProps } from "./Sidebar";

import { useMatchedSubNav } from "../hooks";
import { LayoutPrimary } from "@xyd-js/components/layouts";

function FwNavLogo() {
    const settings = useSettings()

    const logo = typeof settings?.theme?.logo

    if (!logo) {
        return null
    }

    return <a href="/">
        <FwLogo />
    </a>
}

export function FwNav({ kind }: { kind?: "middle" }) {
    const settings = useSettings()
    const activeHeaderPage = useActiveHeaderPage()

    const header = settings?.navigation?.header || []
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
        value={activeHeaderPage}
        kind={kind}
        logo={<FwNavLogo />}
        rightSurface={<>
            {
                rightHeaderExists
                    ? <Nav.Tab
                        value={activeHeaderPage}
                    >
                        {headerMap["right"]}
                    </Nav.Tab>
                    : null
            }

            <Surface target={SurfaceTarget.NavRight} />

            <ColorSchemeButton />

            <LayoutPrimary.Hamburger />
        </>}
    >
        <FwNav.DefaultItems />
    </Nav>
}

FwNav.DefaultItems = function DefaultItems() {
    const defaultItems = useDefaultHeaderItems()

    return defaultItems.map(createHeader)
}

function useDefaultHeaderItems() {
    const settings = useSettings()

    const header = settings?.navigation?.header || []

    return header?.filter(item => {
        return !item.float
    })
}

function useActiveHeaderPage() {
    const matches = useMatches()
    const matchedSubnav = useMatchedSubNav()
    const settings = useSettings()

    const lastMatch = matches[matches.length - 1]

    const header = settings?.navigation?.header || []

    const active = header.find(item => {
        if (matchedSubnav) {
            return pageLink(item.page || "") === pageLink(matchedSubnav?.route)
        }

        return pageLink(item.page || "") === lastMatch?.id
    })


    return active?.page || ""
}

function createHeader(item: Header) {
    const Component = Components[item?.component || ""] || function (p: any) {
        return p.children
    }

    return <Nav.Item
        key={(item.page || "") + item.page}
        href={pageLink(item.href || "") || pageLink(item?.page || "")}
        value={item.page || ""}
        as={$Link}
    >
        <Component {...item.props || {}}>
            {item.title}
        </Component>
    </Nav.Item>
}


export function FwSubNav() {
    const matchedSubnav = useMatchedSubNav()
    const location = useLocation()
    const pathname = trailingSlash(location.pathname)

    if (!matchedSubnav) {
        return null
    }

    // TODO: in the future routing props from settings like {match: "/docs/api/browser"}
    const active = matchedSubnav?.pages.findLast(item => {
        return pathname.startsWith(pageLink(item.page || ""))
    })

    // TODO: value
    return <SubNav
        title={matchedSubnav?.title || ""}
        value={active?.page || ""}
        onChange={() => {
        }}
    >
        {matchedSubnav?.pages.map((item, index) => {
            return <SubNav.Item
                value={item.page || ""}
                href={pageLink(item.page || "")}
                as={$Link}

            >
                {item.title}
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
    const defaultItems = useDefaultHeaderItems()
    const activeHeaderPage = useActiveHeaderPage()

    const footerItems = settings.navigation?.anchors?.bottom?.map(anchor => {
        return <UISidebar.FooterItem href={anchor.url} icon={<Icon name={anchor.icon || ""} />}>
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
            <Surface target={SurfaceTarget.SidebarTop} />
            {/* <div part="header-items">
                {defaultItems.map(item => {
                    return <UISidebar.Item
                        href={pageLink(item.page || "")}
                        active={activeHeaderPage === item.page}
                    >
                        {item.title}
                    </UISidebar.Item>
                })}
            </div> */}

            <SidebarTabsDropdown
                options={defaultItems.map(item => ({
                    label: item.title ?? "",
                    value: item.page || "",
                    icon: item.icon ? <Icon name={item.icon} size={18} /> : null
                }))}
                value={activeHeaderPage}
            />

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
    const metadata = useMetadata()
    const settings = useSettings()
    const toc = useToC()

    if (!toc) {
        return null
    }

    const maxDepth = metadata?.maxTocDepth || settings?.theme?.maxTocDepth || 2

    const renderTocItems = (items: Readonly<ITOC[]>, uiDepth = 0) => {
        return items.map((item) => (
            <React.Fragment key={item.id}>
                <Toc.Item
                    id={item.id}
                    depth={uiDepth}
                >
                    {item.value}
                </Toc.Item>
                {item.children && item.children.length > 0 && renderTocItems(item.children, uiDepth + 1)}
            </React.Fragment>
        ))
    }

    // TODO: maxDepth for specific `#heading`
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
    const [colorScheme] = useColorScheme()

    if (typeof settings?.theme?.logo === "string") {
        return <img src={settings?.theme?.logo} />
    }

    if (isValidElement(settings?.theme?.logo)) {
        return <a href="/">
            {settings?.theme?.logo}
        </a>
    }

    if (typeof settings?.theme?.logo === "object" && colorScheme) {
        return <img src={settings?.theme?.logo[colorScheme as "light" | "dark"]} />
    }

    return null
}

export function FwLink({ children, ...rest }) {
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
    return <Button icon={isCopied ? <Icon name="check" size={12} /> : <Icon name="copy" size={12} />} onClick={handleCopy}>
        Copy page
    </Button>
}

function $Link({ children, ...rest }) {
    let to: To = ""
    let isExternal = false

    if (rest.href) {
        try {
            new URL(rest.href)
            to = rest.href
            // Check if it's an external link
            isExternal = rest.href.startsWith("http://") || rest.href.startsWith("https://")
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

    return <Link {...rest} to={to} target={isExternal ? "_blank" : rest.target}>
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

function pageLink(page: string) {
    if (!page) {
        return ""
    }

    // If it's an external link (starts with http:// or https://), return it as-is
    if (page.startsWith("http://") || page.startsWith("https://")) {
        return page
    }

    return page.startsWith("/") ? page : `/${page}`
}
