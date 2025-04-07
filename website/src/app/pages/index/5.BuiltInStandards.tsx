"use client"

import {Pillar, Section, Stack} from "@primer/react-brand";
import {CodeIcon, PackageIcon} from "@primer/octicons-react";

import {Cards as CardsElement} from "@/app/components/Cards";

import cn from "@/app/App.module.css";

export function BuiltInStandards() {
    return <div id="built-in-standards">
        <Section>
            <div className={cn.BuiltInStandardsGrid}>
                <Stack alignItems="center">
                    <Pillar align="center">
                        <Pillar.Icon icon={<CodeIcon/>} color="purple"/>
                        <Pillar.Heading size="4">
                            Create docs with <br/>
                            modern tools
                        </Pillar.Heading>
                        <Pillar.Description>
                            Build beautiful documentation using the latest tools and frameworks
                            that make writing and maintaining docs a breeze.
                        </Pillar.Description>
                    </Pillar>
                </Stack>

                <CardsElement cards={[
                    {
                        name: 'React Router',
                        href: 'https://reactrouter.com',
                        outlineImage: '/react-router-outline.svg',
                        filledImage: '/react-router-filled.svg',
                    },
                    {
                        name: 'Vite',
                        href: 'https://vite.dev',
                        outlineImage: '/vite-outline.svg',
                        filledImage: '/vite-filled.svg',
                    },
                    {
                        name: 'MDX',
                        href: 'https://mdxjs.com',
                        outlineImage: '/mdx-outline.svg',
                        filledImage: '/mdx-filled.svg',
                    },
                    {
                        name: 'Storybook',
                        href: 'https://storybook.js.org',
                        outlineImage: '/storybook-outline.svg',
                        filledImage: '/storybook-filled.svg',
                    },
                    {
                        name: 'NPM',
                        href: 'https://www.npmjs.com/',
                        outlineImage: '/npm-outline.svg',
                        filledImage: '/npm-filled.svg',
                    },
                    {
                        name: 'Github',
                        href: 'https://github.com',
                        outlineImage: '/github-outline.svg',
                        filledImage: '/github-filled.svg',
                    }
                ]}/>

                <Stack alignItems="center">
                    <Pillar align="center">
                        <Pillar.Icon icon={<PackageIcon/>} color="purple"/>
                        <Pillar.Heading size="4">
                            Document APIs with <br/>
                            industry standards
                        </Pillar.Heading>
                        <Pillar.Description>
                            Generate comprehensive API documentation from your codebase using
                            GraphQL, OpenAPI or TypeDoc specifications.
                        </Pillar.Description>
                    </Pillar>
                </Stack>

                <CardsElement cards={[
                    {
                        name: 'GraphQL',
                        href: 'https://graphql.org/',
                        outlineImage: '/graphql-outline.svg',
                        filledImage: '/graphql-filled.svg',
                    },
                    {
                        name: 'OpenAPI',
                        href: 'https://www.openapis.org/',
                        outlineImage: '/openapi-outline.svg',
                        filledImage: '/openapi-filled.svg',
                    },
                    {
                        name: 'Typedoc',
                        href: 'https://typedoc.org',
                        outlineImage: '/typedoc-outline.svg',
                        filledImage: '/typedoc-filled.svg',
                    },
                ]}/>
            </div>
        </Section>
    </div>
}