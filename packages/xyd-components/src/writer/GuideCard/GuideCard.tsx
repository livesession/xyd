import React from "react"

import {$guide, $list} from "./GuideCard.styles";

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
        ${$guide.host}
        ${kind === "secondary" && $guide.host$$secondary}
        ${kind === "secondary" && size == "md" && $guide.host$$secondary$$md}
    `}>
        <a className={$guide.link} href={href}>
            <div className={`
                ${$guide.item}
                ${kind === "secondary" && $guide.item$$secondary}
            `}>
                {icon && <div className={$guide.icon}>
                    {icon}
                </div>}
                <div className={$guide.right}>
                    <div className={$guide.title}>
                        <div className={`
                            ${$guide.title} 
                            ${$guide.titleBody}
                            ${size == "md" && $guide.titleBody$$md}
                        `}>
                            {title}
                        </div>
                        <$Pointer/>
                    </div>
                    <div className={`
                        ${$guide.body}
                        ${size == "md" && $guide.body$$md}
                    `}>
                        {children}
                    </div>
                </div>
            </div>
        </a>
    </div>
}

GuideCard.List = function GuideCardList({children}: { children: React.ReactNode }) {
    return <div className={$list.host}>
        {children}
    </div>
}

function $Pointer() {
    return <div data-pointer="true" className={$guide.pointer}>
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