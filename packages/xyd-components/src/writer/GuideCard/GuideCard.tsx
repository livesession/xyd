import React from "react"

import * as cn from "./GuideCard.styles";

export interface GuideCardProps {
    children: React.ReactNode;
    href: string
    title: string;
    icon?: React.ReactNode;
    kind?: "secondary"
    size?: "sm" | "md"
}

export function GuideCard({
                              children,
                              href,
                              icon,
                              title,
                              kind,
                              size,

                          }: GuideCardProps) {
    return <div className={`
        ${cn.GuideHost}
        ${kind === "secondary" && cn.GuideHostSecondary}
        ${kind === "secondary" && size == "md" && cn.GuideHostSecondaryMd}
    `}>
        <a className={cn.GuideLink} href={href}>
            <div className={`
                ${cn.GuideItem}
                ${kind === "secondary" && cn.GuideItemSecondary}
            `}>
                {icon && <div className={cn.GuideIcon}>
                    {icon}
                </div>}
                <div className={cn.GuideRight}>
                    <div className={cn.GuideTitle}>
                        <div className={`
                            ${cn.GuideTitle} 
                            ${cn.GuideTitleBody}
                            ${size == "md" && cn.GuideTitleBodyMd}
                        `}>
                            {title}
                        </div>
                        <Pointer/>
                    </div>
                    <div className={`
                        ${cn.GuideBody}
                        ${size == "md" && cn.GuideBodyMd}
                    `}>
                        {children}
                    </div>
                </div>
            </div>
        </a>
    </div>
}

GuideCard.List = function GuideCardList({children}: { children: React.ReactNode }) {
    return <div className={cn.GuideListHost}>
        {children}
    </div>
}

function Pointer() {
    return <div data-pointer="true" className={cn.GuidePointer}>
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