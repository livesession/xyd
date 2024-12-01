import React from "react"
import {Menu, MenuContent, MenuItem, MenuSubTrigger} from "@radix-ui/react-menu";
import cn from "clsx";
import {tv} from "tailwind-variants";

import {HAnchor} from "./Anchor";

function styled() {

}

styled.menu = tv({
    slots: {
        container: "relative inline-block",
        trigger: "-ml-2 hidden items-center whitespace-nowrap rounded p-2 md:inline-flex",
        content: cn(
            "absolute right-0 z-20 mt-1 max-h-64 min-w-full overflow-auto rounded-md ring-1 ring-black/5 bg-white",
            "py-1 text-sm shadow-lg dark:ring-white/20 dark:bg-neutral-800"
        )
    },
    variants: {
        inactive: {
            true: "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        }
    }
})

styled.item = tv({
    slots: {
        anchor: cn(
            'relative hidden w-full select-none whitespace-nowrap text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 md:inline-block',
            'py-1.5 transition-colors ltr:pl-3 ltr:pr-9 rtl:pr-3 rtl:pl-9'
        )
    },
})

export interface HNavbarMenuProps {
    children: React.ReactNode;

    menu: React.ReactElement<HNavbarMenuItemProps>[]; // Updated type

    className?: string;
}

export function HNavbarMenu(props: HNavbarMenuProps) {
    const {container, trigger, content} = styled.menu()

    return (
        <div className={container()}>
            <Menu>
                <MenuSubTrigger className={trigger({class: props.className, inactive: true})}>
                    {props.children}
                </MenuSubTrigger>
                <MenuContent className={content()}>
                    {props.menu}
                </MenuContent>
            </Menu>
        </div>
    );
}

export interface HNavbarMenuItemProps {
    onSelect: () => void;

    children: React.ReactNode;

    newWindow?: boolean;
}

export function HNavbarMenuItem(props: HNavbarMenuItemProps) {
    const {anchor} = styled.item()

    return <MenuItem onSelect={props.onSelect}>
        <HAnchor
            className={anchor()}
            newWindow={props.newWindow}
        >
            {props.children}
        </HAnchor>
    </MenuItem>
}