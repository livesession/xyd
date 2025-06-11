import React from "react"

import { Button } from "../Button"
import { Text } from "../Text"

import * as cn from "./Card.styles"

interface CardProps {
    title: string
    href?: string
    link?: React.ElementType

    description?: string

    imgSrc?: string
    imgAlt?: string

    shadow?: "md"
}

export function Card(props: CardProps) {
    const {
        title,
        description,
        imgSrc,
        imgAlt,
        shadow,
        href,
        link,
    } = props

    const Link = link

    return <xyd-card
        data-shadow={shadow || undefined}
        className={cn.CardHost}
    >
        {imgSrc && (
            <div part="image-container">
                <div part="bg">
                    <img src={imgSrc} alt={imgAlt} />
                </div>
            </div>
        )}

        <div part="body">
            <div part="header">
                {Link && href ?
                    <Text weight="bold">
                        <Link href={href}>
                            {title}
                        </Link>
                    </Text>
                    : <Text weight="bold">
                        {title}
                    </Text>}
                <Button size="sm" kind="secondary">
                    Source
                </Button>
            </div>
            <div part="description">
                <Text size="small">
                    {description}
                </Text>
            </div>
        </div>
    </xyd-card>
}

