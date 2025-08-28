import React from "react"

import { Button } from "../Button"
import { Text } from "../Text"

import * as cn from "./Card.styles"

interface CardProps {
    title: string
    href?: string
    link?: React.ElementType

    description?: string
    btnText?: string

    imgSrc?: string
    imgAlt?: string

    logoSrc?: string
    logoAlt?: string

    shadow?: "md"
}

export function Card(props: CardProps) {
    const {
        title,
        description,
        imgSrc,
        imgAlt,
        logoSrc,
        logoAlt,
        shadow,
        href,
        link,
        btnText,
    } = props

    const Link = link

    const cardContent = (
        <xyd-card
            data-shadow={shadow || undefined}
            className={cn.CardHost}
        >
            {imgSrc && (
                <div part="image-container">
                    <div part="bg">
                        <img src={imgSrc} alt={imgAlt} />
                        <div part="bg-shadow" />
                    </div>

                    {
                        Link && href && logoSrc && <span
                            part="author-link"
                        >
                            <img
                                src={logoSrc}
                                alt={logoAlt}
                            />
                        </span>
                    }

                </div>
            )}

            <div part="body">
                <div part="header">
                    <Text weight="bold">
                        {title}
                    </Text>
                    {
                        btnText && <Button size="md" kind="secondary">
                            {btnText}
                        </Button>
                    }
                </div>
                <div part="description">
                    <Text size="small">
                        {description}
                    </Text>
                </div>
            </div>
        </xyd-card>
    )

    // If no imgSrc and we have Link and href, wrap the entire card in a link
    if (!btnText && Link && href) {
        return (
            <Link href={href}>
                {cardContent}
            </Link>
        )
    }

    return cardContent
}

