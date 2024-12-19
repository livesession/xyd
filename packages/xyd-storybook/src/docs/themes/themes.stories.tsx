import React, {useEffect, useState} from 'react';
import type {Meta} from '@storybook/react';
import {MemoryRouter} from "react-router";

import {
    Layout,
} from '@xyd/components/layouts';

import {
    UIAside,
    UIBreadcrumb,

    UIFile,
    UIFolder,
    UIMenu,

    UINavLinks,

    UISeparator,
    getComponents,

} from "@xyd/ui";
import {Nav, Toc, SubNav} from "@xyd/ui2"

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
        subheader
        aside={<DemoSidebar/>}
        content={<DemoContent/>}
        contentNav={<DemoTOC/>}
    />
}

function DemoNavbar() {
    return <>
        <Nav
            value="api-reference"
            logo={<LiveSessionPlatformLogo/>}
            kind="middle"
        >
            <Nav.Item value="docs" href="/docs">
                Docs
            </Nav.Item>
            <Nav.Item value="api-reference" href="/api">
                API Reference
            </Nav.Item>
            <Nav.Item value="graphql" href="/graphql">
                GraphQL
            </Nav.Item>
        </Nav>
        <SubNav title="Apps" value="build">
            <SubNav.Item value="build" href="/build">
                Build
            </SubNav.Item>
            <SubNav.Item value="design" href="/design">
                Design
            </SubNav.Item>
            <SubNav.Item value="launch" href="/launch">
                Launch
            </SubNav.Item>
        </SubNav>
    </>
}

function DemoSidebar() {
    const [isOpen, setIsOpen] = useState(false)

    return <UIAside>
        <UIMenu>
            <UISeparator>
                Get Started
            </UISeparator>

            <UIFile title="Introduction" href="/introduction"/>
            <UIFolder title="Root nested" isOpen active>
                <UIFile title="Nested A"/>
                <UIFile title="Nested B"/>
                <UIFolder title="Nested root C" isOpen active>
                    <UIFile title="Nested C.A"/>
                    <UIFile title="Nested C.B"/>
                </UIFolder>
            </UIFolder>

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

