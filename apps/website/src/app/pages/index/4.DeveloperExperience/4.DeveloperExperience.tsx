"use client"

import {
    Grid,
    Heading,
    River,
    RiverBreakout,
    Section,
    SectionIntro,
    Text,
    Timeline
} from "@primer/react-brand";

import {IconNPM} from "@/app/components";

import {XydTerminalTour} from "./XydTerminalTour";

import typocn from "@/app/styles/Typography.module.css";

export function DeveloperExperience() {
    return <div id="developer-experience">
        <Section>
            <SectionIntro align="center">
                <SectionIntro.Label color="blue-purple" leadingVisual={<IconNPM/>}>
                    <code><b>npm i -g xyd-js</b>
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
                            <XydTerminalTour/>
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
                                    <b>API first</b> approach with powerful customization features and extensible
                                    architecture.
                                </Timeline.Item>
                            </Timeline>
                        )}
                    >
                        <Heading size="3">
                            Simplified for Developers. <br/>
                            Built for Everyone.
                        </Heading>
                        <Text>
                            Experience a streamlined documentation process that removes complexity while maintaining
                            power.
                            Create and maintain beautiful documentation with ease.
                        </Text>
                    </RiverBreakout.Content>
                </River>
            </Grid.Column>
        </Grid>
    </div>
}