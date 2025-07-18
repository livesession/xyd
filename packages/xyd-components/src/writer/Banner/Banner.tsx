import React, { useEffect, useState } from "react";

import { Button, Icon } from "../../../writer";

import * as cn from "./Banner.styles";

// TODO: move to system?

export interface BannerProps {
    children: React.ReactNode;
    kind?: "secondary";
    label?: string;
    href?: string;
    icon?: React.ReactNode | string;
    store?: number; // seconds until banner can show again
}

export function Banner(props: BannerProps) {
    const { isVisible, handleClose } = useBannerStorage(props.store, props.label);

    const onCloseHandler = () => {
        handleClose();
        props.onClose?.();
    };

    if (!isVisible) {
        return null;
    }

    if (props.kind === "secondary") {
        return <Banner.Secondary {...props} onClose={onCloseHandler} />;
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
        <div part="content">
            <a href={props.href} target="_blank">
                {icon}

                {props.children}
                {props.label ? <span part="info">{props.label}</span> : null}

                {
                    props.href ? (
                        <svg
                            viewBox="0 0 20 20"
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
        {
            (props.store) ? (
                <div part="close">
                    <IconClose onClick={onCloseHandler} />
                </div>
            ) : null
        }
    </xyd-banner>
}


Banner.Secondary = function BannerSecondary(props: BannerProps & { onClose?: () => void }) {
    const { isVisible, handleClose } = useBannerStorage(props.store, props.label);

    const onCloseHandler = () => {
        handleClose();
        props.onClose?.();
    };

    if (!isVisible) {
        return null;
    }

    let label: React.ReactNode = null
    if (props.label) {
        label = <Button size="sm" kind="secondary">
            {props.label}
        </Button>
    }

    return <xyd-banner data-kind="secondary" className={cn.BannerSecondaryHost}>
        {props.children}
        {label}
        <div part="close">
            <IconClose onClick={onCloseHandler} />
        </div>
    </xyd-banner>
}

function useBannerStorage(store?: number, label?: string) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (store) {
            const storageKey = `xyd-banner-closed-${label || 'default'}`;
            const closedUntil = localStorage.getItem(storageKey);
            
            if (closedUntil) {
                const now = Date.now();
                const canShowAgain = parseInt(closedUntil) <= now;
                setIsVisible(canShowAgain);
            }
        }
    }, [store, label]);

    const handleClose = () => {
        if (store) {
            const storageKey = `xyd-banner-closed-${label || 'default'}`;
            const now = Date.now();
            const showAgainAt = now + (store * 1000);
            localStorage.setItem(storageKey, showAgainAt.toString());
        }
        
        setIsVisible(false);
    };

    return { isVisible, handleClose };
}

function IconClose(props: { onClick?: () => void }) {
    return <svg
        xmlns="http://www.w3.org/2000/svg"
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        onClick={props.onClick}
    >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </svg>
}
