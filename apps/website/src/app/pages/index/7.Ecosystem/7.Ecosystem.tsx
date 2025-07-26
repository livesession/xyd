"use client"

import {
    Link,
    RiverBreakout,
    Section,
    SectionIntro,
    Text,
    Timeline
} from "@primer/react-brand";

import dynamic from 'next/dynamic';

const HeroDiagram = dynamic(() => import("@/app/pages/index/7.Ecosystem/EcosystemDiagram/HeroDiagram"), {
    ssr: false
});

export function Ecosystem() {
    return <div id="ecosystem" style={{
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
                    <code>xyd</code> seamlessly connects your favorite tools and frameworks into a unified documentation
                    system -
                    from content creation to API documentation, everything works together in <br/>perfect harmony
                </SectionIntro.Description>
            </SectionIntro>

            <HeroDiagram/>

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
                        <b>One system to connect them all.</b> <code>xyd</code> acts as the central hub that brings
                        together
                        your documentation tools, frameworks, and workflows into a single, powerful platform.
                    </Text>
                    <Link href="https://docs.xyd.dev">Explore our connected ecosystem</Link>
                </RiverBreakout.Content>
            </RiverBreakout>
        </Section>
    </div>

}