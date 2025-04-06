import React, { useState, useEffect } from 'react'

import {
    Box,
    Hero,
    Section,
    Stack,
    SectionIntro,
    Card, ThemeProvider,
    SubNav, SubdomainNavBar,
    Grid,
    Button,
    CTABanner,
    Text,
    Pillar, IDE, River, Heading,
    RiverBreakout,
    Timeline,
    Link,
} from "@primer/react-brand";

import {
    MarkGithubIcon,
    ZapIcon,
    CodeIcon,
    PackageIcon,
    SearchIcon
} from "@primer/octicons-react";

import { Safari } from './components/Safari';
import { CardsElement } from "./components/lit/CardsWrapper";
import FeaturesShowcase from './components/FeaturesShowcase';
import { Ecosystem } from './components/Ecosystem';
import HeroDiagram from './components/hero-diagram-react/src/components/HeroDiagram';

import navcn from './styles/SubNav.module.css';
import cn from './App.module.css'
import typocn from "./styles/Typography.module.css";
import { Terminal } from './components/Terminal';
import { Terminal2 } from './components/Terminal2';
import { Terminal3 } from './components/Terminal3';

function IconNPM() {
    return <svg
        width={32}
        height={24}
        viewBox="0 0 104 42"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <g clipPath="url(#clip0_5_303)">
            <path
                d="M21 9H83V29.5714H52V33H38.2222V29.5714H21V9ZM24.4444 26.1429H31.3333V15.8571H34.7778V26.1429H38.2222V12.4286H24.4444V26.1429ZM41.6667 12.4286V29.5714H48.5556V26.1429H55.4444V12.4286H41.6667ZM48.5556 15.8571H52V22.7143H48.5556V15.8571ZM58.8889 12.4286V26.1429H65.7778V15.8571H69.2222V26.1429H72.6667V15.8571H76.1111V26.1429H79.5556V12.4286H58.8889Z"
                fill="#CB3837"
            />
            <path
                d="M24.4444 26.1428H31.3333V15.8571H34.7778V26.1428H38.2222V12.4286H24.4444V26.1428Z"
                fill="white"
            />
            <path
                d="M41.6667 12.4286V29.5714H48.5556V26.1428H55.4444V12.4286H41.6667ZM52 22.7143H48.5556V15.8571H52V22.7143Z"
                fill="white"
            />
            <path
                d="M58.8889 12.4286V26.1428H65.7778V15.8571H69.2222V26.1428H72.6667V15.8571H76.1111V26.1428H79.5556V12.4286H58.8889Z"
                fill="white"
            />
        </g>
        <defs>
            <clipPath id="clip0_5_303">
                <rect width={62} height={24} fill="white" transform="translate(21 9)" />
            </clipPath>
        </defs>
    </svg>
}


function Logo({ ...props }) {
    return <svg
        width={93}
        height={101}
        viewBox="0 0 93 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M62.2449 43.43C59.7248 43.4124 54.7109 43.5197 47.7615 46.3961C39.6634 49.7488 23.5552 55.8247 11.9226 62.0998C3.78665 66.4888 0.193375 72.3434 0.138331 80.2609C0.0614553 91.2494 8.6878 100.218 19.405 100.292L64.3082 100.605C79.7021 100.712 92.2703 88.0033 92.38 72.2196C92.4897 56.4359 80.8945 43.5596 62.2449 43.43Z"
            fill="white"
        />
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M55.7025 19.1452C55.7025 26.8824 51.1596 33.8582 44.1898 36.8241L30.0486 42.8414C15.7446 48.9283 0.000554681 38.1503 0.000556069 22.2715C0.000557145 9.96859 9.7292 -0.0034098 21.7282 -4.87465e-05L37.0388 0.00426701C47.3473 0.00666792 55.7025 8.57563 55.7025 19.1452Z"
            fill="white"
        />
        <path
            d="M58 18.4998C58 28.717 65.3586 37 74.4357 37L76.5647 37C85.6419 37 93 28.7174 93 18.5002C93 8.28303 85.6419 -2.64438e-06 76.5647 -2.24761e-06L74.4357 -2.15455e-06C65.3586 -1.75777e-06 58 8.28264 58 18.4998Z"
            fill="white"
        />
    </svg>
    return <svg
        width={93}
        height={105}
        viewBox="0 0 93 105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M30.3345 104.159C32.8547 104.159 37.8677 104.017 44.797 101.092C52.8715 97.6832 68.9371 91.4955 80.5258 85.1396C88.631 80.6942 92.1835 74.8148 92.1835 66.8971C92.184 55.9083 83.4955 47 72.7781 47H27.8738C12.4795 47 0 59.7954 0 75.5795C0 91.3635 11.6845 104.159 30.3345 104.159Z"
            fill="white"
        />
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M55.7019 19.1453C55.7019 26.8824 51.159 33.8582 44.1893 36.8242L30.048 42.8414C15.744 48.9284 1.05545e-05 38.1504 1.19427e-05 22.2715C1.30182e-05 9.96864 9.72866 -0.00335907 21.7277 1.97502e-06L37.0383 0.00431545C47.3467 0.00671635 55.7019 8.57568 55.7019 19.1453Z"
            fill="white"
        />
        <path
            d="M76.0685 2C67.1943 2 60 9.37616 60 18.475V20.6091C60 29.708 67.194 37.0837 76.0681 37.0837C84.9423 37.0837 92.1366 29.708 92.1366 20.6091V18.475C92.1366 9.37616 84.9427 2 76.0685 2Z"
            fill="white"
        />
    </svg>

    return <svg
        width={89}
        height={97}
        viewBox="0 0 89 97"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M23.1355 96.1589C25.6556 96.1589 33.7571 95.5251 41.1355 94C51.2571 91.9078 67.6355 85.5 76.7426 77.1396C82.886 71.5 88.4004 66.8148 88.4004 58.8971C88.4009 47.9083 79.7124 39 68.9949 39C53.6006 39 7.0541 44.9205 1.63548 61.5C-3.78314 78.0795 4.48547 96.1589 23.1355 96.1589Z"
            fill="white"
        />
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M51 17.6134C51 24.7315 46.8406 31.1492 40.4592 33.8778L27.5116 39.4136C14.415 45.0136 -2.35118e-06 35.0979 -1.07408e-06 20.4895C-8.45802e-08 9.17103 8.90743 -0.00308948 19.8936 2.63907e-06L33.9118 0.00397098C43.3501 0.00617978 51 7.88953 51 17.6134Z"
            fill="white"
        />
        <path
            d="M72.0685 0C63.1943 0 56 7.37616 56 16.475V18.6091C56 27.708 63.194 35.0837 72.0681 35.0837C80.9423 35.0837 88.1366 27.708 88.1366 18.6091V16.475C88.1366 7.37616 80.9427 0 72.0685 0Z"
            fill="white"
        />
    </svg>
    return <svg
        width={93}
        height={97}
        viewBox="0 0 93 97"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M30.3345 96.1589C32.8547 96.1589 37.8677 96.0168 44.797 93.0922C52.8715 89.6832 68.9371 83.4955 80.5258 77.1396C88.631 72.6942 92.1835 66.8148 92.1835 58.8971C92.184 47.9083 83.4955 39 72.7781 39C57.3838 39 0 51.7954 0 67.5795C0 83.3635 11.6845 96.1589 30.3345 96.1589Z"
            fill="white"
        />
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M55.7019 19.1453C55.7019 26.8824 51.159 33.8582 44.1893 36.8242L30.048 42.8414C15.744 48.9284 1.05545e-05 38.1504 1.19427e-05 22.2715C1.30182e-05 9.96864 9.72866 -0.00335907 21.7277 1.97502e-06L37.0383 0.00431545C47.3467 0.00671635 55.7019 8.57568 55.7019 19.1453Z"
            fill="white"
        />
        <path
            d="M76.0685 0C67.1943 0 60 7.37616 60 16.475V18.6091C60 27.708 67.194 35.0837 76.0681 35.0837C84.9423 35.0837 92.1366 27.708 92.1366 18.6091V16.475C92.1366 7.37616 84.9427 0 76.0685 0Z"
            fill="white"
        />
    </svg>
}
function App() {
    const [activeSection, setActiveSection] = useState('home');

    useEffect(() => {
        const sections = document.querySelectorAll('div[id]');
        let currentSection = 'home';

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    if (id !== currentSection) {
                        currentSection = id;
                        setActiveSection(id);
                    }
                }
            });
        }, {
            rootMargin: '-20% 0px -80% 0px',
            threshold: 0
        });

        sections.forEach(section => {
            observer.observe(section);
        });

        // Handle hash changes
        const handleHashChange = () => {
            const hash = window.location.hash.slice(1) || 'home';
            currentSection = hash;
            setActiveSection(hash);
        };

        // Set initial section based on hash
        handleHashChange();

        window.addEventListener('hashchange', handleHashChange);
        return () => {
            observer.disconnect();
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, []);

    const designTokenOverrides = `
  .custom-colors[data-color-mode='dark'] {

    /*
     * Modify the value of these tokens.
     * Remember to apply light mode equivalents if you're enabling theme switching.
     */
    --brand-CTABanner-shadow-color-start: var(--base-color-scale-purple-5);
    --brand-CTABanner-shadow-color-end: var(--base-color-scale-red-5);

  }
`

    return (
        <>
            <div id="home">
                <SubdomainNavBar title="xyd" fixed={false}>
                    <SubdomainNavBar.Link href="#">Guide</SubdomainNavBar.Link>
                    <SubdomainNavBar.Link href="#">Reference</SubdomainNavBar.Link>
                    <SubdomainNavBar.Link href="#">Articles</SubdomainNavBar.Link>
                    <SubdomainNavBar.Link href="#">Events</SubdomainNavBar.Link>
                    <SubdomainNavBar.Link href="#">Video</SubdomainNavBar.Link>
                    <SubdomainNavBar.Link href="#">Social</SubdomainNavBar.Link>
                    <SubdomainNavBar.SecondaryAction
                        target="_blank"
                        href="https://github.com/livesession/xyd"
                        trailingVisual={<MarkGithubIcon />}
                    >
                        <>Star us on</>
                    </SubdomainNavBar.SecondaryAction>
                </SubdomainNavBar>

                <Grid>
                    <Grid.Column>
                        <Hero align="center">
                            <Hero.Label color="pink-blue">
                                v0.1.0 coming soon
                            </Hero.Label>
                            <Logo />

                            <Hero.Heading size="1">
                                The Docs Platform<br />
                                for future dev
                            </Hero.Heading>
                            <Hero.Description>
                                Powerful and flexible documentation platform <br />
                                with developer experience in mind.
                            </Hero.Description>
                            <Hero.PrimaryAction href="https://docs.xyd.dev">
                                Get Started
                            </Hero.PrimaryAction>
                            <Hero.SecondaryAction
                                as="a"
                                href="https://github.com/livesession/xyd"
                                leadingVisual={<MarkGithubIcon />}
                            >
                                GitHub
                            </Hero.SecondaryAction>
                        </Hero>
                    </Grid.Column>
                    <Grid.Column>
                        <Safari
                            imageSrc="/public/docs-hero.png"
                            url="docs.your-company.dev" mode="simple" />
                    </Grid.Column>
                </Grid>
            </div>

            <Section backgroundColor="subtle">
                <SectionIntro align="center">
                    <SectionIntro.Heading size="2">
                        Redefining developer experience
                    </SectionIntro.Heading>
                    <SectionIntro.Description>
                        <code>xyd</code> makes docs development great again by streamlining the entire documentation process,
                        from writing and reviewing to publishing and maintaining
                    </SectionIntro.Description>
                    {/*<Box padding="spacious">*/}
                    {/*    <LitCounterWrapper start={0}/>*/}
                    {/*</Box>*/}
                </SectionIntro>
            </Section>

            <div className={navcn.SubNavContainer}>
                <SubNav className={navcn.SubNav}>
                    <SubNav.Link href="#home" aria-current={activeSection === 'home' ? 'page' : undefined}>| Home | </SubNav.Link>

                    <SubNav.Link href="#developer-experience" aria-current={activeSection === 'developer-experience' ? 'page' : undefined}>Developer Experience</SubNav.Link>
                    <SubNav.Link href="#built-in-standards" aria-current={activeSection === 'built-in-standards' ? 'page' : undefined}>Built-in Standards</SubNav.Link>
                    <SubNav.Link href="#customization" aria-current={activeSection === 'customization' ? 'page' : undefined}>Customization</SubNav.Link>
                    <SubNav.Link href="#ecosystem" aria-current={activeSection === 'ecosystem' ? 'page' : undefined}>Ecosystem</SubNav.Link>
                    {/* <SubNav.Action as="button" onClick={() => {
                        window.location.href = "https://docs.xyd.dev";
                    }} hasArrow={true}>
                        Get started
                    </SubNav.Action> */}
                </SubNav>
            </div>

            <div id="developer-experience">
                <Section>
                    <SectionIntro align="center">
                        <SectionIntro.Label color="blue-purple" leadingVisual={<IconNPM />}>
                            <code>
                                <b>
                                    npm i -g xyd-js
                                </b>
                            </code>
                        </SectionIntro.Label>
                        <SectionIntro.Heading size="2" className={typocn.ShinyText}>
                            Start in seconds
                        </SectionIntro.Heading>
                        <SectionIntro.Description>
                            <code>xyd</code> is built with the latest technologies and frameworks, allowing you to
                            quickly set up your documentation site and start writing
                        </SectionIntro.Description>
                    </SectionIntro>



                    {/*<Grid>*/}
                    {/*    <Grid.Column span={6}>*/}
                    {/*        <Terminal2/>*/}
                    {/*    </Grid.Column>*/}
                    {/*    <Grid.Column span={6}>*/}
                    {/*        <Terminal3/>*/}
                    {/*    </Grid.Column>*/}
                    {/*</Grid>*/}
                </Section>

                <Grid>
                    <Grid.Column>
                        <River align="end">
                            <River.Visual hasShadow={false}>
                                <div style={{
                                    padding: "5px"
                                }}>
                                    <Terminal3 />
                                </div>
                            </River.Visual>
                            <RiverBreakout.Content
                                trailingComponent={() => (
                                    <Timeline>
                                        <Timeline.Item>
                                            <b>CLI</b> to run, build and deploy your docs.
                                        </Timeline.Item>
                                        <Timeline.Item>
                                            <b>Hot Module Replacement</b> for instant updates.
                                        </Timeline.Item>
                                        <Timeline.Item>
                                            <b>API first</b> approach with powerful customization features and extensible architecture.
                                        </Timeline.Item>
                                    </Timeline>
                                )}
                            >
                                <Text>
                                    <Heading size="3">
                                        Simplified for Developers. <br />
                                        Built for Everyone.
                                    </Heading>
                                    Experience a streamlined documentation process that removes complexity while maintaining power.
                                    Create and maintain beautiful documentation with ease.
                                </Text>
                            </RiverBreakout.Content>
                        </River>
                    </Grid.Column>
                </Grid>
            </div>

            <div id="built-in-standards">
                <Section>
                    <div className={cn.BuiltInStandardsGrid}>
                        <div>
                            <Stack alignItems="center">
                                <Pillar align="center">
                                    <Pillar.Icon icon={<CodeIcon />} color="purple" />
                                    <Pillar.Heading size="4">
                                        Create docs with <br />
                                        modern tools
                                    </Pillar.Heading>
                                    <Pillar.Description>
                                        Build beautiful documentation using the latest tools and frameworks
                                        that make writing and maintaining docs a breeze.
                                    </Pillar.Description>
                                </Pillar>
                            </Stack>
                        </div>

                        <div>
                            <CardsElement cards={[
                                {
                                    name: 'React Router',
                                    href: 'https://reactrouter.com',
                                    outlineImage: '/public/react-router-outline.svg',
                                    filledImage: '/public/react-router-filled.svg',
                                },
                                {
                                    name: 'Vite',
                                    href: 'https://vite.dev',
                                    outlineImage: '/public/vite-outline.svg',
                                    filledImage: '/public/vite-filled.svg',
                                },
                                {
                                    name: 'MDX',
                                    href: 'https://mdxjs.com',
                                    outlineImage: '/public/mdx-outline.svg',
                                    filledImage: '/public/mdx-filled.svg',
                                },
                                {
                                    name: 'Storybook',
                                    href: 'https://storybook.js.org',
                                    outlineImage: '/public/storybook-outline.svg',
                                    filledImage: '/public/storybook-filled.svg',
                                },
                                {
                                    name: 'NPM',
                                    href: 'https://www.npmjs.com/',
                                    outlineImage: '/public/npm-outline.svg',
                                    filledImage: '/public/npm-filled.svg',
                                },
                                {
                                    name: 'Github',
                                    href: 'https://github.com',
                                    outlineImage: '/public/github-outline.svg',
                                    filledImage: '/public/github-filled.svg',
                                }
                            ]} />
                        </div>

                        <div>
                            <Stack alignItems="center">
                                <Pillar align="center">
                                    <Pillar.Icon icon={<PackageIcon />} color="purple" />
                                    <Pillar.Heading size="4">
                                        Document APIs with <br />
                                        industry standards
                                    </Pillar.Heading>
                                    <Pillar.Description>
                                        Generate comprehensive API documentation from your codebase using
                                        GraphQL, OpenAPI or TypeDoc specifications.
                                    </Pillar.Description>
                                </Pillar>
                            </Stack>
                        </div>

                        <div>
                            <CardsElement cards={[
                                {
                                    name: 'GraphQL',
                                    href: 'https://graphql.org/',
                                    outlineImage: '/public/graphql-outline.svg',
                                    filledImage: '/public/graphql-filled.svg',
                                },
                                {
                                    name: 'OpenAPI',
                                    href: 'https://www.openapis.org/',
                                    outlineImage: '/public/openapi-outline.svg',
                                    filledImage: '/public/openapi-filled.svg',
                                },
                                {
                                    name: 'Typedoc',
                                    href: 'https://typedoc.org',
                                    outlineImage: '/public/typedoc-outline.svg',
                                    filledImage: '/public/typedoc-filled.svg',
                                },
                            ]} />
                        </div>
                    </div>
                </Section>
            </div>

            <div id="customization">
                <FeaturesShowcase />
            </div>

            <div id="ecosystem">
                <Section>
                    <SectionIntro align="center">
                        <SectionIntro.Label color="blue-purple">
                            Connected Documentation System
                        </SectionIntro.Label>
                        <SectionIntro.Heading size="2">
                            Your Documentation Hub
                        </SectionIntro.Heading>
                        <SectionIntro.Description>
                            <code>xyd</code> seamlessly connects your favorite tools and frameworks into a unified documentation system.
                            From content creation to API documentation, everything works together in perfect harmony.
                        </SectionIntro.Description>
                    </SectionIntro>

                    <HeroDiagram />

                    <RiverBreakout>
                        <RiverBreakout.A11yHeading>Unified Documentation Experience</RiverBreakout.A11yHeading>
                        <RiverBreakout.Content
                            trailingComponent={() => (
                                <Timeline>
                                    <Timeline.Item>
                                        <b>Seamless Integration</b> of MDX, React, and modern frameworks for content creation.
                                    </Timeline.Item>
                                    <Timeline.Item>
                                        <b>Connected API Docs</b> that automatically sync with your GraphQL, OpenAPI, and TypeDoc specifications.
                                    </Timeline.Item>
                                    <Timeline.Item>
                                        <b>Unified Workflow</b> that brings together writing, reviewing, and publishing in one cohesive system.
                                    </Timeline.Item>
                                </Timeline>
                            )}
                        >
                            <Text>
                                <b>One system to connect them all.</b> <code>xyd</code> acts as the central hub that brings together
                                your documentation tools, frameworks, and workflows into a single, powerful platform.
                            </Text>
                            <Link href="https://docs.xyd.dev">Explore our connected ecosystem</Link>
                        </RiverBreakout.Content>
                    </RiverBreakout>
                </Section>
            </div>

            <div id="cta-footer">
                <Section>
                    <ThemeProvider colorMode="dark" className="custom-colors">
                        <style>{designTokenOverrides}</style>
                        <CTABanner hasBackground={true} align="center">
                            <CTABanner.Heading>
                                Join the future <br />
                                of docs
                            </CTABanner.Heading>
                            <CTABanner.Description>
                                <code>xyd</code> is a modern documentation platform built for developers <br />
                                to create, manage and share docs with ease
                            </CTABanner.Description>
                            <CTABanner.ButtonGroup>
                                <Button>
                                    Get started
                                </Button>
                            </CTABanner.ButtonGroup>
                        </CTABanner>
                    </ThemeProvider>
                </Section>
            </div>
        </>
    )
}

export default App

function Abc() {
    return <Section backgroundColor="subtle">
        <Stack
            direction="horizontal"
            alignItems="center"
            justifyContent="center"
            gap="normal"
        >
            <Box>
                <Card
                    href="https://github.com"
                    fullWidth
                    hasBorder
                    disableAnimation
                >
                    <Card.Icon icon={ZapIcon} color="lime" hasBackground />
                    <Card.Image
                        src="https://webcontainers.io/img/svelte-screen-light.png"
                        alt="placeholder, blank area with an gray background color"
                    />
                    <Card.Heading>Code search & code view</Card.Heading>
                    <Card.Description>
                        Enables you to rapidly search, navigate, and understand code, right from
                        GitHub.com.
                    </Card.Description>
                </Card>

            </Box>

            <Box>
                <Card
                    href="https://github.com"
                    fullWidth
                    hasBorder
                    disableAnimation
                >
                    <Card.Icon icon={ZapIcon} color="lime" hasBackground />
                    <Card.Image
                        src="https://webcontainers.io/img/svelte-screen-light.png"
                        alt="placeholder, blank area with an gray background color"
                    />
                    <Card.Heading>Code search & code view</Card.Heading>
                    <Card.Description>
                        Enables you to rapidly search, navigate, and understand code, right from
                        GitHub.com.
                    </Card.Description>
                </Card>

            </Box>

            <Box>
                <Card
                    href="https://github.com"
                    fullWidth
                    hasBorder
                    disableAnimation
                >
                    <Card.Icon icon={ZapIcon} color="lime" hasBackground />
                    <Card.Image
                        src="https://webcontainers.io/img/svelte-screen-light.png"
                        alt="placeholder, blank area with an gray background color"
                    />
                    <Card.Heading>Code search & code view</Card.Heading>
                    <Card.Description>
                        Enables you to rapidly search, navigate, and understand code, right from
                        GitHub.com.
                    </Card.Description>
                </Card>
            </Box>
        </Stack>
    </Section>
}

