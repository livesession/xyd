"use client"

import {Grid, Hero} from "@primer/react-brand";
import {MarkGithubIcon} from "@primer/octicons-react";

import {
    Header,
    IconXyd,
    Safari
} from "@/app/components";

import cn from "@/app/App.module.css";

export function Home() {
    return <>
        <div id="home" style={{ // TODO: styles
            position: "relative",
            overflowX: "hidden",
        }}>
            <div className={cn.heroBackground}/>

            <Header/>

            <$Hero/>
        </div>
    </>
}

function $Hero() {
    return <Grid>
        <Grid.Column>
            <Hero align="center">
                <Hero.Label color="pink-blue">
                    v0.1.0 coming soon
                </Hero.Label>
                <IconXyd/>

                <Hero.Heading size="1">
                    The Docs Platform<br/>
                    for future dev
                </Hero.Heading>
                <Hero.Description>
                    Powerful and flexible documentation platform <br/>
                    with developer experience in mind.
                </Hero.Description>
                <Hero.PrimaryAction href="https://docs.xyd.dev">
                    Get Started
                </Hero.PrimaryAction>
                <Hero.SecondaryAction
                    as="a"
                    href="https://github.com/livesession/xyd"
                    leadingVisual={<MarkGithubIcon/>}
                >
                    GitHub
                </Hero.SecondaryAction>
            </Hero>
        </Grid.Column>
        <Grid.Column style={{marginBottom: 100}}>
            <Safari
                imageSrc="/docs-hero.png"
                url="docs.your-company.dev"
                mode="simple"
            />
        </Grid.Column>
    </Grid>
}