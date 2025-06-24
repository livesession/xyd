import React from "react";

import { Button, Icon } from "../../writer";

import * as cn from "./Banner.styles";

// TODO: move to system?

export interface BannerProps {
    children: React.ReactNode;
    kind?: "secondary";
    label?: string;
    href?: string;
    icon?: React.ReactNode | string;
}

export function Banner(props: BannerProps) {
    if (props.kind === "secondary") {
        return <Banner.Secondary {...props} />;
    }

    let icon: React.ReactNode = null
    if (props.icon) {
        if (typeof props.icon === "string") {
            icon = <Icon name={props.icon} size={16} />
        } else {
            icon = props.icon
        }
    }

    return <xyd-banner className={cn.BannerHost}>
        <div>
            <a href={props.href}>
                {icon}

                {props.children}
                {props.label ? <span part="info">{props.label}</span> : null}

                {
                    props.href ? (
                        <svg
                            viewBox="0 0 20 20"
                            part="icon"
                            style={{ width: 20, height: 20 }}
                        >
                            <path
                                fillRule="evenodd"
                                d="M3.5 10a.75.75 0 0 1 .75-.75h9.69l-2.72-2.72a.75.75 0 1 1 1.06-1.06l4 4a.75.75 0 0 1 0 1.06l-4 4a.75.75 0 0 1-1.06-1.06l2.72-2.72h-9.69a.75.75 0 0 1-.75-.75Z"
                            />
                        </svg>
                    ) : null
                }
            </a>
        </div>
    </xyd-banner>
}

Banner.Secondary = function BannerSecondary(props: BannerProps) {
    let label: React.ReactNode = null
    if (props.label) {
        label = <Button size="sm" kind="secondary">
            {props.label}
        </Button>
    }

    return <xyd-banner data-kind="secondary" className={cn.BannerSecondaryHost}>
        {props.children}
        {label}
    </xyd-banner>
}