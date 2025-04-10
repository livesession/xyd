import React from "react";

import cn from "./TocCard.module.css";

interface TocCardProps {
    title: string;
    description: string;
    href: string;
}

export function TocCard({ title, description, href }: TocCardProps) {
    return <div className={cn.TocBottomHost}>
        <div className={cn.TocBottomContainer}>
            <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className={cn.TocBottomLink}
            >
                <div className={cn.TocBottomLinkTitleContainer}>
                    <div className={cn.TocBottomLinkTitle}>{title}</div>
                    <img
                        // TODO in the future build-time src and ssr also?
                        src="https://github.com/favicon.ico"
                        alt={`${title} favicon`}
                        className={cn.TocBottomLinkIcon}
                    />
                </div>
                <div className={cn.TocBottomDescription}>
                    {description}
                </div>
            </a>
        </div>
    </div>
}