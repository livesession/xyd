import React from "react"

import * as cn from "./GuideCard.styles";

export interface GuideCardProps {
    children: React.ReactNode;
    href: string
    title: string;
    icon?: React.ReactNode;
    kind?: "secondary"
    size?: "sm" | "md"
    className?: string
}

export function GuideCard({
    children,
    href,
    icon,
    title,
    kind,
    size,
    className,
}: GuideCardProps) {
    return <xyd-guidecard
        className={`${cn.GuideHost} ${className || ""}`}
        data-kind={kind}
        data-size={size}
    >
        <a part="link" href={href}>
            <div part="item">
                {icon && <div part="icon">
                    {icon}
                </div>}
                <div part="right">
                    <div part="title">
                        <div part="title-body">
                            {title}
                        </div>
                        <$Pointer />
                    </div>
                    <div part="body">
                        {children}
                    </div>
                </div>
            </div>
        </a>
    </xyd-guidecard>
}

GuideCard.List = function GuideCardList({ children }: { children: React.ReactNode }) {
    return <xyd-guidecard-list className={cn.GuideListHost}>
        {children}
    </xyd-guidecard-list>
}

function $Pointer() {
    return <div part="pointer">
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            fill="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                fillRule="evenodd"
                d="M9.293 7.293a1 1 0 0 1 1.414 0l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414-1.414L12.586 12 9.293 8.707a1 1 0 0 1 0-1.414Z"
                clipRule="evenodd"
            />
        </svg>
    </div>
}