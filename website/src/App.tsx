import { useState, useEffect } from 'react'

import {
    Hero,
    Section,
    Stack,
    SectionIntro,
    ThemeProvider,
    SubNav,
    Grid,
    Button,
    CTABanner,
    Text,
    Pillar, River, Heading,
    RiverBreakout,
    Timeline,
    Link,
} from "@primer/react-brand";
import {
    SubdomainNavBar,
    MinimalFooter
} from "@cosmocss/land"

import {
    MarkGithubIcon,
    CodeIcon,
    PackageIcon,
} from "@primer/octicons-react";

import { Safari } from './components/Safari';
import { CardsElement } from "./components/lit/CardsWrapper";
import FeaturesShowcase from './components/FeaturesShowcase';
import HeroDiagram from './components/hero-diagram-react/src/components/HeroDiagram';
import { Terminal3 } from './components/Terminal3';

import navcn from './styles/SubNav.module.css';
import cn from './App.module.css'
import typocn from "./styles/Typography.module.css";
import { LiveSessionLogo } from './components/LiveSessionLogo';

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
            <div id="home" style={{
                position: "relative",
                overflowX: "hidden",
            }}>
                <div className={cn.heroBackground} />
                <SubdomainNavBar
                    logoHref="https://livesession.io"
                    logo={<LiveSessionLogo fill="#fff" />}
                    // @ts-ignore
                    title={<code>xyd</code>}
                    fixed={false}
                >
                    <SubdomainNavBar.Link href="#">Guide</SubdomainNavBar.Link>
                    <SubdomainNavBar.Link href="#">Reference</SubdomainNavBar.Link>
                    <SubdomainNavBar.SecondaryAction
                        // @ts-ignore
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
                    <Grid.Column style={{ marginBottom: 100 }}>
                        <Safari
                            imageSrc="/docs-hero.png"
                            url="docs.your-company.dev" mode="simple"
                        />
                    </Grid.Column>
                </Grid>
            </div>

            <div id="main-section-intro">
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
            </div>

            <div id="sub-nav" className={navcn.SubNavContainer}>
                <SubNav className={navcn.SubNav}>
                    <SubNav.Link href="#home" aria-current={activeSection === 'home' ? 'page' : undefined}>| Home | </SubNav.Link>

                    <SubNav.Link href="#developer-experience" aria-current={activeSection === 'developer-experience' ? 'page' : undefined}>Developer Experience</SubNav.Link>
                    <SubNav.Link href="#built-in-standards" aria-current={activeSection === 'built-in-standards' ? 'page' : undefined}>Built-in Standards</SubNav.Link>
                    <SubNav.Link href="#customization" aria-current={activeSection === 'customization' ? 'page' : undefined}>Customization</SubNav.Link>
                    <SubNav.Link href="#ecosystem" aria-current={activeSection === 'ecosystem' ? 'page' : undefined}>Ecosystem</SubNav.Link>
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
                            ]} />
                        </div>
                    </div>
                </Section>
            </div>

            <div id="customization">
                <FeaturesShowcase />
            </div>

            <div id="ecosystem" style={{
                position: "relative",
            }}>
                <Section style={{
                    overflow: "hidden",

                }}>
                    <SectionIntro align="center">
                        <SectionIntro.Label color="blue-purple">
                            Ecosystem
                        </SectionIntro.Label>
                        <SectionIntro.Heading size="2">
                            Omnichannel Docs
                        </SectionIntro.Heading>
                        <SectionIntro.Description>
                            <code>xyd</code> seamlessly connects your favorite tools and frameworks into a unified documentation system -
                            from content creation to API documentation, everything works together in <br />perfect harmony
                        </SectionIntro.Description>
                    </SectionIntro>

                    <HeroDiagram />

                    <RiverBreakout>
                        <RiverBreakout.A11yHeading>Unified Documentation Experience</RiverBreakout.A11yHeading>
                        <RiverBreakout.Content
                            trailingComponent={() => (
                                <Timeline>
                                    <Timeline.Item>
                                        <b>Tech Stack</b> that allows you to use your favorite tools and frameworks.
                                    </Timeline.Item>
                                    <Timeline.Item>
                                        <b>Plugin Oriented</b> architecture that allows you to extend the platform with ease.
                                    </Timeline.Item>
                                    <Timeline.Item>
                                        <b>AI Ready</b> with built-in support for AI tools.
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
                        <CTABanner hasBackground={true} hasShadow={false} hasBorder={false} align="center">
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

            <div id="footer">
                <MinimalFooter
                    logo={<LiveSessionLogo fill="#fff" />}
                    logoHref="https://livesession.io"
                    socialLinks={[]} // TODO: github in the future (need changes @cosmocss/land)
                    copyrightStatement={<>
                        Released under the MIT License. <br />
                        © 2025 LiveSession. All rights reserved.
                    </>}
                />
            </div>
        </>
    )
}

export default App
