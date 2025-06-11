import React from "react";

import cn from "./TocCard.module.css";
import { Icon } from "writer";

interface TocCardProps {
    title: string;
    description: string;
    href: string;
    className?: string;
    icon?: string;
    as?: React.ElementType;
}

export function TocCard({ title, description, href, className, icon, as }: TocCardProps) {
    const Link = as || $Link;

    return <xyd-toccard
        className={`${cn.TocCardHost} ${className || ""}`}
    >
        <div part="container">
            <Link
                part="link"
                href={href}
                target="_blank"
                rel="noreferrer"
            >
                <div part="title-container">
                    <div part="title">{title}</div>
                    {icon && <Icon name={icon} size={16} />}
                </div>
                <div part="description">
                    {description}
                </div>
            </Link>
        </div>
    </xyd-toccard>
}

function $Link({ children, href, ...props }: React.ComponentProps<'a'>) {
    return <a href={href} {...props}>{children}</a>
}