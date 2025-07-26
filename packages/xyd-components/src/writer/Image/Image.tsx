

import React from 'react';

import * as cn from "./Image.styles"

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string
    alt: string
    style?: React.CSSProperties
    caption?: string
}

export function Image(props: ImageProps) {
    const { src, alt, style, caption, children, ...rest } = props

    const img = <img
        src={src}
        alt={alt}
        style={style}
        className={cn.ImageHost}
        {...rest}
    />

    if (!caption) {
        return img
    }

    return <>
        <figure>
            {img}
            <figcaption>{caption}</figcaption>
        </figure>
    </>
}