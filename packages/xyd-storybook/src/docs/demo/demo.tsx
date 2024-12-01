import React, {useState} from "react";

import {
    HNav,
    HNavItem,
    HNavLogo,

    HToc,
    HTocItem,
    HTocMeta,

    HSeparator,
    HAside,
    HMenu,
    HFile,
    HFolder,

    HNavLinks,
    HBreadcrumb,

    getComponents,
} from "@xyd/ui/headless";
import {
    LyDefault
} from "@xyd/ui/layouts";

import Content from "../../content/hello-world.mdx";
import {LiveSessionPlatformLogo} from "./logo";

const Layout = LyDefault((props) => <>{props.children}</>)

export function Full() {
    return <Layout
        navbar={<DemoNavbar/>}
        sidebar={<DemoSidebar/>}
        navigation={<HNavLinks
            prev={{
                title: "Prev",
                href: "/prev"
            }}
            next={{
                title: "Next",
                href: "/next"
            }}
        />}
        toc={<DemoTOC/>}
        breadcrumbs={<HBreadcrumb
            items={[
                {
                    title: "APIs",
                    href: "/apis"
                },
                {
                    title: "GraphQL API",
                    href: "/apis/graphql"
                }
            ]}
        />}
    >
        {/* @ts-ignore */}
        <Content components={getComponents()}/>
    </Layout>
}

function DemoNavbar() {
    return <HNav>
        <HNavLogo>
            <LiveSessionPlatformLogo/>
        </HNavLogo>

        <>
            <HNavItem href="/example" active>
                Docs
            </HNavItem>
            <HNavItem href="/example">
                API Reference
            </HNavItem>
            <HNavItem href="/example">
                GraphQL
            </HNavItem>
        </>
    </HNav>
}

function DemoSidebar() {
    const [isOpen, setIsOpen] = useState(false)

    return <HAside>
        <HMenu>
            <HSeparator>
                Get Started
            </HSeparator>

            <HFile title="Introduction" href="/introduction"/>
            <HFile title="Authentication" href="/authentication"/>
            <HFile title="Making Requests" href="/making-requests"/>

            <HSeparator>
                APIs
            </HSeparator>

            <HFile title="GraphQL API" href="/introduction" active/>
            <HFile title="REST API" href="/authentication"/>
            <HFile title="Webhooks" href="/making-requests"/>
            <HFile title="Browser API" href="/making-requests"/>
            <HFile title="Mobile API" href="/making-requests"/>
            <HFile title="Data Warehouse" href="/making-requests"/>

            <HFolder
                onClick={() => setIsOpen(!isOpen)}
                isOpen={isOpen}
                title="Nested root"
                asButton
            >
                <HFile title="Nested child" href="/introduction"/>
            </HFolder>
        </HMenu>
    </HAside>
}

function DemoTOC() {
    return <HToc
        title="GitHub Flavored Markdown"
        meta={<HTocMeta>Supa meta</HTocMeta>}
    >
        <>
            <HTocItem depth={3} href={"#abc"}>
                Strikethrough
            </HTocItem>
            <HTocItem depth={4} href={""}>
                Task List
            </HTocItem>
            <HTocItem depth={3} href={""}>
                Table
            </HTocItem>
            <HTocItem depth={3} href={""}>
                Autolinks
            </HTocItem>
            <HTocItem depth={3} href={""}>
                Custom Heading Id
            </HTocItem>
        </>
    </HToc>
}


