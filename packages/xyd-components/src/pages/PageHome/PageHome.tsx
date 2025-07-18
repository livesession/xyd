import * as React from "react"

import {
    Heading,
    GuideCard,
    List,
    Button,
} from "../../writer";

import {
    GuideCardProps
} from "../../writer/GuideCard/GuideCard"

import { GridDecorator } from "../../content/GridDecorator";

import * as cn from "./PageHome.styles"

interface PageHomeHeroButton {
    title: string;
    href: string;
}

interface PageHomeHero {
    title?: string;
    description?: string;
    image?: string;
    button?: PageHomeHeroButton;
}

interface PageHomeCard extends GuideCardProps {

}

interface PageHomeSection {
    title?: string
    cards?: PageHomeCard[]
}

interface PageHomeProps {
    hero?: PageHomeHero;
    sections?: PageHomeSection[]
}

export function PageHome(props: PageHomeProps) {
    return <page-home className={cn.PageHome}>
        <div part="hero">
            {props?.hero?.image ? <img src={props.hero.image} alt={props.hero.title} /> : null}
            <Heading size={1}>
                {props.hero?.title}
            </Heading>
            <Heading size={3} kind="muted">
                {props.hero?.description}
            </Heading>

            {props?.hero?.button ? <Button href={props.hero.button.href}>{props.hero.button.title}</Button> : null}
        </div>

        <div part="sections">
            {
                props.sections?.map((section, index) => <React.Fragment key={`${section.title}-${index}`}>
                    {
                        section?.title ? <div part="section-title">
                            <Heading size={3}>
                                {section.title}
                            </Heading>
                        </div> : null
                    }

                    {
                        section?.cards?.length ? <div part="section-cards">
                            <GridDecorator cols={3}>
                                <List>
                                    <List.Item>
                                        <List>
                                            {section.cards?.map((card, index) => (
                                                <List.Item key={`${card.title}-${index}`}>
                                                    <GuideCard {...card} />
                                                </List.Item>
                                            ))}
                                        </List>
                                    </List.Item>
                                </List>
                            </GridDecorator>
                        </div> : null
                    }
                </React.Fragment>)
            }
        </div>
    </page-home>
}