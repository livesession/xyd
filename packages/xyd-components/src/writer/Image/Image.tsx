

import React from 'react';

import * as cn from "./Image.styles"

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string
    alt: string
    style?: React.CSSProperties
}

export function Image(props: ImageProps) {
    const { src, alt, style, children, ...rest } = props

    return <img
        src={src}
        alt={alt}
        className={cn.ImageHost}
        style={style}
        {...rest}
    />
}
