import React, {useEffect, useState} from 'react';
import type {Meta} from '@storybook/react';
import {MemoryRouter} from "react-router";

import {
    Layout,
} from '@xyd/components/layouts';
import {
    getComponents,
    HAside,
    HBreadcrumb,
    HFile,
    HFolder,
    HMenu,
    HNav,
    HNavItem,
    HNavLinks,
    HNavLogo,
    HSeparator,
    HToc,
    HTocItem,
} from "@xyd/ui/headless";

import {LiveSessionPlatformLogo} from "./logo.tsx";
import Content from "../../content/hello-world.mdx";

export default {
    title: 'Themes/Default',
    decorators: [
        (Story) => <MemoryRouter>
            <Story/>
        </MemoryRouter>
    ]
} as Meta;

export const Default = () => {
    return <Layout
        header={<DemoNavbar/>}
        aside={<DemoSidebar/>}
        content={<DemoContent/>}
        contentNav={<DemoTOC/>}
    />
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

function DemoContent() {
    return <>
        <HBreadcrumb
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
        />

        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px"
        }}>
            <Content components={getComponents()}/>
        </div>

        <HNavLinks
            prev={{
                title: "Prev",
                href: "/prev"
            }}
            next={{
                title: "Next",
                href: "/next"
            }}
        />
    </>
}

function DemoTOC() {
    return <HToc
        title="GitHub Flavored Markdown"
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

