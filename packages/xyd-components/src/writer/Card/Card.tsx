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

    return <xyd-card
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
                    Link && href && logoSrc && <Link
                        target="_blank"
                        rel="noopener"
                        part="author-link"
                        href={href}
                    >
                        <img
                            src={logoSrc}
                            alt={logoAlt}
                        />
                    </Link>
                }

            </div>
        )}

        <div part="body">
            <div part="header">
                {Link && href && !logoSrc ?
                    <Text weight="bold">
                        <Link href={href}>
                            {title}
                        </Link>
                    </Text>
                    : <Text weight="bold">
                        {title}
                    </Text>}
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
}

