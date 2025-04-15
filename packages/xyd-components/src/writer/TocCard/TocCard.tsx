import React from "react";

import cn from "./TocCard.module.css";

interface TocCardProps {
    title: string;
    description: string;
    href: string;
    className?: string;
    as?: React.ElementType;
}

export function TocCard({ title, description, href, className, as }: TocCardProps) {
    const Link = as || $Link;

    return <div
        data-element="xyd-toccard"
        className={`${cn.TocCardHost} ${className || ""}`}
    >
        <div data-part="container">
            <Link
                data-part="link"
                href={href}
                target="_blank"
                rel="noreferrer"
            >
                <div data-part="title-container">
                    <div data-part="title">{title}</div>
                    <img
                        // TODO in the future build-time src and ssr also?
                        data-part="link-icon"
                        src="https://github.com/favicon.ico"
                        alt={`${title} favicon`}
                    />
                </div>
                <div data-part="description">
                    {description}
                </div>
            </Link>
        </div>
    </div>
}

function $Link({ children, href, ...props }: React.ComponentProps<typeof Link>) {
    return <a {...props}>{children}</a>
}