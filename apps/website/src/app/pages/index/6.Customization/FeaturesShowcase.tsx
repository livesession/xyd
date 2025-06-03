"use client"

import React, { useState } from 'react';
import { Grid, Section, SectionIntro, Text } from '@primer/react-brand';

import { Terminal } from "@/app/components";
import { Feature } from "./types";

import cn from './FeaturesShowcase.module.css';

interface FeaturesShowcaseProps {
    features: Feature[];
}

export function FeaturesShowcase({ features }: FeaturesShowcaseProps) {
    const [activeFeature, setActiveFeature] = useState(features[0].id);

    return (
        <Section>
            <SectionIntro align="center">
                <SectionIntro.Heading size="3">
                    Built-in framework for <br /> customizations
                </SectionIntro.Heading>
                <SectionIntro.Description>
                    Each layer of our platform is optimized<br /> to let you customize it to your needs.
                </SectionIntro.Description>
            </SectionIntro>

            <Grid>
                <Grid.Column span={{ xsmall: 12, small: 12, medium: 12, large: 6, xlarge: 6, xxlarge: 6 }}>
                    <ul className={cn.StepsList}>
                        {features.map((feature) => (
                            <li
                                key={feature.id}
                                onMouseEnter={() => setActiveFeature(feature.id)}
                                onClick={() => setActiveFeature(feature.id)}
                                role="tab"
                                aria-selected={activeFeature === feature.id}
                                tabIndex={0}
                                className={activeFeature === feature.id ? cn.Active : ''}
                            >
                                <span className={cn.Step} />
                                <span className={cn.Description}>
                                    <Text>{feature.name}</Text>
                                </span>
                            </li>
                        ))}
                    </ul>
                </Grid.Column>
                <Grid.Column span={{ xsmall: 12, small: 12, medium: 12, large: 6, xlarge: 6, xxlarge: 6 }}>
                    <Terminal header={false}>
                        {features.find(f => f.id === activeFeature)?.code}
                    </Terminal>
                </Grid.Column>
            </Grid>
        </Section>
    );
}
