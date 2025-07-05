import React from 'react'
import * as cn from "./HomePage.styles";

import {HomeView} from "../../../views"
import {IHomePageHero, IHomePageFeature} from "./types";

function Button() {
    return <>TODO</>
}
function CTABanner() {
    return <>TODO</>
}
function GuideCard() {
    return <>TODO</>
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
    const subtitle = typeof props.hero?.subtitle === 'string' 
        ? props.hero.subtitle 
        : props.hero?.subtitle?.toString() || "";

    return <CTABanner>
        <CTABanner.Heading
            title={props.hero?.text || ""}
            subtitle={subtitle}
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
            ${cn.HomePageCardsHost}
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


