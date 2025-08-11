"use client"

import {Button, CTABanner, Section} from "@primer/react-brand";

export function CTAFooter() {
    return <div id="cta-footer">
        <Section>
            <CTABanner
                align="center"
                hasBackground={true}
                hasShadow={false}
                hasBorder={false}
            >
                <CTABanner.Heading>
                    Join the future <br/>
                    of docs
                </CTABanner.Heading>
                <CTABanner.Description>
                    <code>xyd</code> is a modern documentation platform built for developers <br/>
                    to create, manage and share docs with ease
                </CTABanner.Description>
                <CTABanner.ButtonGroup>
                    <Button>
                        Get started
                    </Button>
                </CTABanner.ButtonGroup>
            </CTABanner>
        </Section>
    </div>
}