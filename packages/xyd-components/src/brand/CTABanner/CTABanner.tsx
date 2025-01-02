import React from "react"
import {css} from "@linaria/core";

const $banner = {
    host: css`
        padding: 20px;
    `,
    container: css`
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 80px;
    `,
    hero: css`
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 40px;
    `,
    headingEffect: css`
        background: -webkit-linear-gradient(
                120deg,
                var(--headingEffect-color-tertiary) 20%,
                var(--headingEffect-color-tertiary) 30%,
                var(--headingEffect-color-secondary) 60%,
                var(--headingEffect-color-primary) 75%,
                var(--headingEffect-color-primary) 85%
        );
        background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: wave 5s infinite;
        background-size: 200% 200%;
        background-position: 50% 50%; // Start with all colors visible

        @keyframes wave {
            0% {
                background-position: 50% 50%;
            }
            50% {
                background-position: 0% 50%;
            }
            100% {
                background-position: 50% 50%;
            }
        }
    `
}

export interface CTABannerProps {
    children: React.ReactNode
}

export function CTABanner({children}: CTABannerProps) {
    return <div className={$banner.host}>
        <div className={$banner.container}>
            <div className={$banner.hero}>
                {children}
            </div>
        </div>
    </div>
}

const $heading = {
    host: css`
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
    `,
    title: css`
        font-size: 76px;
        font-weight: 900;
        text-align: center;
        letter-spacing: 3px;
        margin: 0;
    `,
    subtitle: css`
        color: #3c3c43;
        font-size: 46px;
        font-weight: 600;
        text-align: center;
    `
}

export interface CTABannerHeadingProps {
    title: string
    subtitle: string | React.ReactNode
    headingEffect?: boolean
}

CTABanner.Heading = function CTABannerHeading({title, subtitle, headingEffect}: CTABannerHeadingProps) {
    return <div className={$heading.host}>
        <h1 className={$heading.title}>
            {
                headingEffect
                    ? <span className={$banner.headingEffect}>
                        {title}
                      </span>
                    : title
            }
        </h1>
        <p className={$heading.subtitle}>
            {subtitle}
        </p>
    </div>
}

const $btnGroup = {
    host: css`
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
    `
}

CTABanner.ButtonGroup = function CTABannerButtonGroup({children}) {
    return <div className={$btnGroup.host}>
        {children}
    </div>
}