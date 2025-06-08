

import React from 'react';

import * as cn from "./Image.styles"

export interface ImageProps {
    src: string
    alt: string
    style?: React.CSSProperties
}

export function Image(props: ImageProps) {
    return <img
        src={props.src}
        alt={props.alt}
        className={cn.ImageHost}
    />
}