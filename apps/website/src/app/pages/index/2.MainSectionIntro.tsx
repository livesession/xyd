"use client"

import {Section, SectionIntro} from "@primer/react-brand";

export function MainSectionIntro() {
    return <div id="main-section-intro">
        <Section backgroundColor="subtle">
            <SectionIntro align="center">
                <SectionIntro.Heading size="2">
                    Redefining developer experience
                </SectionIntro.Heading>
                <SectionIntro.Description>
                    <code>xyd</code> makes docs development great again
                    by streamlining the entire documentation process,
                    from writing and reviewing to publishing and maintaining
                </SectionIntro.Description>
            </SectionIntro>
        </Section>
    </div>
}