import React, {useEffect, useState} from 'react';
import type {Meta} from '@storybook/react';
import {MemoryRouter} from "react-router";

import {
    Layout,
} from '@xyd/components/layouts';

import {
    getComponents,
    UIAside,
    UIBreadcrumb,

    UIFile,
    UIFolder,
    UIMenu,
    UINav,

    UINavItem,
    UINavLinks,
    UINavLogo,

    UISeparator,

    UIToc,
    UITocItem,
} from "@xyd/ui";
import {Toc} from "@xyd/ui2"

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
    return <UINav>
        <UINavLogo>
            <LiveSessionPlatformLogo/>
        </UINavLogo>

        <>
            <UINavItem href="/example" active>
                Docs
            </UINavItem>
            <UINavItem href="/example">
                API Reference
            </UINavItem>
            <UINavItem href="/example">
                GraphQL
            </UINavItem>
        </>
    </UINav>
}

function DemoSidebar() {
    const [isOpen, setIsOpen] = useState(false)

    return <UIAside>
        <UIMenu>
            <UISeparator>
                Get Started
            </UISeparator>

            <UIFile title="Introduction" href="/introduction"/>
            <UIFile title="Authentication" href="/authentication"/>
            <UIFile title="Making Requests" href="/making-requests"/>

            <UISeparator>
                APIs
            </UISeparator>

            <UIFile title="GraphQL API" href="/introduction" active/>
            <UIFile title="REST API" href="/authentication"/>
            <UIFile title="Webhooks" href="/making-requests"/>
            <UIFile title="Browser API" href="/making-requests"/>
            <UIFile title="Mobile API" href="/making-requests"/>
            <UIFile title="Data Warehouse" href="/making-requests"/>

            <UIFolder
                onClick={() => setIsOpen(!isOpen)}
                isOpen={isOpen}
                title="Nested root"
                asButton
            >
                <UIFile title="Nested child" href="/introduction"/>
            </UIFolder>
        </UIMenu>
    </UIAside>
}

function DemoContent() {
    return <>
        <UIBreadcrumb
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

        <UINavLinks
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
    return <Toc defaultValue="quickstart">
        <Toc.Item value="quickstart">
            Quickstart
        </Toc.Item>
        <Toc.Item value="api-features">
            API Features
        </Toc.Item>
        <Toc.Item value="example-use-cases">
            Example Use Cases
        </Toc.Item>
    </Toc>
}

