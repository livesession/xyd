import React from "react"
import cn from "clsx";
import {tv} from 'tailwind-variants';

import {HAnchor} from "./Anchor";

// TODO: NavbarMenu

// TODO: its concept only?, HOW TO MODYFIKY EXPORT STYLED + WHAT IF MANY EXPORTS STYLED
function styled() {}

styled.nav = tv({
    slots: {
        container: cn(
            "xyd-nav-container sticky top-0 z-20 w-full bg-transparent print:hidden",
            "flex",
        ),
        shadow: cn(
            'xyd-nav-container-blur',
            'pointer-events-none absolute z-[-1] h-full w-full bg-white dark:bg-dark',
            // 'shadow-[0_2px_4px_rgba(0,0,0,.02),0_1px_0_rgba(0,0,0,.06)] dark:shadow-[0_-1px_0_rgba(255,255,255,.1)_inset]',
            // 'contrast-more:shadow-[0_0_0_1px_#000] contrast-more:dark:shadow-[0_0_0_1px_#fff]'
        ),
        // shadow: "",
        base: cn(
            "flex w-full h-[var(--xyd-navbar-height)] items-center justify-end gap-2",
            "pl-[max(env(safe-area-inset-left),1rem)] pr-[max(env(safe-area-inset-right),1rem)]",
        )
    },
})

styled.item = tv({
    slots: {
        base: cn(
            "text-sm contrast-more:text-gray-700 contrast-more:dark:text-gray-100",
            "relative -ml-2 whitespace-nowrap p-2 md:inline-block",
            "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        ),
        title1: cn(
            "absolute inset-x-0 text-center"
        ),
        title2: cn(
            "invisible font-medium"
        ),
    },
    variants: {
        active: {
            true: "subpixel-antialiased font-bold",
        },
    },
})


styled.logo = tv({
    base: "flex items-center mr-auto ltr:mr-auto rtl:ml-auto",
})

export interface HNavProps {
    className?: string;
    children?: React.ReactNode;
}

export function HNav(props: HNavProps) {
    const {container, shadow, base} = styled.nav()

    return <div className={container()}>
        <div className={shadow()}/>
        <nav
            className={base({class: props.className})}>
            {props.children}
        </nav>
    </div>
}

export interface HNavItemProps {
    children: React.ReactNode;
    href: string;
    newWindow?: boolean;
    active?: boolean
}

export function HNavItem(props: HNavItemProps) {
    const {base, title1, title2} = styled.item()

    return <HAnchor
        href={props.href}
        className={base({
            active: props.active && !props.newWindow
        })}
        newWindow={props.newWindow} aria-current={!props.newWindow && props.active}
    >
        <span className={title1()}>{props.children}</span>
        <span className={title2()}>{props.children}</span>
    </HAnchor>
}

export interface HNavLogoProps {
    children: React.ReactNode;

    className?: string;
}

export function HNavLogo(props: HNavLogoProps) {
    return <div className={styled.logo({class: props.className})}>
        {props.children}
    </div>
}