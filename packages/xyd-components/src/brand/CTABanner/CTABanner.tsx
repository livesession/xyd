import React from "react";
import * as cn from "./CTABanner.styles";

export interface CTABannerProps {
    children: React.ReactNode;
}

export interface CTABannerHeadingProps {
    title: string;
    subtitle: string;
}

export interface CTABannerButtonGroupProps {
    children: React.ReactNode;
}

export function CTABanner({children}: CTABannerProps) {
    return (
        <div className={cn.CTABannerHost}>
            <div className={cn.CTABannerContainer}>
                <div className={cn.CTABannerHero}>
                    {children}
                </div>
            </div>
        </div>
    );
}

function Heading({title, subtitle}: CTABannerHeadingProps) {
    return (
        <div className={cn.CTABannerHeadingHost}>
            <div className={cn.CTABannerHeadingEffect}>
                <h1 className={cn.CTABannerHeadingTitle}>{title}</h1>
            </div>
            <h2 className={cn.CTABannerHeadingSubtitle}>{subtitle}</h2>
        </div>
    );
}

function ButtonGroup({children}: CTABannerButtonGroupProps) {
    return (
        <div className={cn.CTABannerButtonGroupHost}>
            {children}
        </div>
    );
}

CTABanner.Heading = Heading;
CTABanner.ButtonGroup = ButtonGroup;