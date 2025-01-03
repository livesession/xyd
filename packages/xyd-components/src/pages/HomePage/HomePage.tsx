import React from 'react'
import {css} from "@linaria/core";

import {
    GuideCard,
} from "../../writer"
import {Button, CTABanner} from "../../brand"
import {HomeView} from "../../views"

import {IHomePageHero, IHomePageFeature} from "./types";

const $cards = {
    host: css`
        display: grid;
        grid-template-columns: repeat(2, 500px);
        justify-content: center;
        gap: 30px;

        @media (max-width: 1200px) {
            grid-template-columns: repeat(2, 1fr);
        }

        @media (max-width: 768px) {
            grid-template-columns: 1fr;
        }
    `,
}

export interface HomePageProps {
    header: React.ReactNode

    children?: React.ReactNode
    hero?: IHomePageHero
    footer?: React.ReactNode
    features?: IHomePageFeature[]
}

export function HomePage(props: HomePageProps) {
    return <HomeView
        header={props.header}
        body={<HomeView.Body>
            <$Hero {...props}/>

            {props.hero?.actions && <$Cards {...props}/>}

            {props.children}
        </HomeView.Body>}
        footer={props.footer}
    />
}

function $Hero(props: HomePageProps) {
    return <CTABanner>
        <CTABanner.Heading
            title={props.hero?.text || ""}
            headingEffect={props.hero?.textEffect}
            subtitle={props.hero?.subtitle}
        />
        {props?.hero?.actions && <CTABanner.ButtonGroup>
            {props?.hero?.actions.map((action, index) => (
                <a href={action.href}>
                    <Button key={action.text + index} kind={action.kind}>
                        {action.text}
                    </Button>
                </a>
            ))}
        </CTABanner.ButtonGroup>}
    </CTABanner>
}

function $Cards(props: HomePageProps) {
    // TODO: cards gridTemplateColumns based on elements
    return <div
        className={`
            ${$cards.host}
            xyd_page-comp-homepage-cards
        `}>
        {props.features?.map((feat, index) => (
            <GuideCard
                key={feat.title + index}
                href={feat.href || ""}
                title={feat.title}
                icon={feat.icon}
                kind="secondary"
                size="md"
            >
                {feat.description}
            </GuideCard>
        ))}
    </div>
}


