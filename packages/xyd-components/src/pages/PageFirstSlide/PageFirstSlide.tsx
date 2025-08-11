import * as React from "react"

import {
    Heading,
    Button,
} from "../../writer";

import { PageFirstSlideProps } from "./types";

import * as cn from "./PageFirstSlide.styles"

export function PageFirstSlide(props: PageFirstSlideProps) {
    return <page-first-slide className={cn.PageFirstSlide}>
        <div part="left">
            {props.content?.title && (
                <Heading size={1}>
                    {props.content.title}
                </Heading>
            )}

            {props.content?.description && (
                <Heading size={4} kind="muted">
                    {props.content.description}
                </Heading>
            )}

            <div part="buttons">
                {props.content?.primaryButton && (
                    <Button
                        href={props.content.primaryButton.href}
                        kind={props.content.primaryButton.kind || "primary"}
                        size="lg"
                        disabled={props.content.primaryButton.disabled}
                    >
                        {props.content.primaryButton.title}
                    </Button>
                )}

                {props.content?.secondaryButton && (
                    <Button
                        href={props.content.secondaryButton.href}
                        kind={props.content.secondaryButton.kind || "secondary"}
                        size="lg"
                        disabled={props.content.secondaryButton.disabled}
                    >
                        {props.content.secondaryButton.title}
                    </Button>
                )}
            </div>
        </div>

        <div part="right">
            {props.rightContent}
        </div>
    </page-first-slide>
} 