import React, { useState } from "react";
import { Link } from "react-router"
import { Popover } from "radix-ui";

import { Icon } from "@xyd-js/components/writer";

import * as cn from "./SidebarTabsDropdown.styles";

export interface SidebarTabsDropdownOption {
    label: string;
    value: string;
    href?: string | null;
    description?: string;
    icon?: React.ReactNode | string;
}

export interface SidebarTabsDropdownProps {
    options: SidebarTabsDropdownOption[];
    value: string;
}

// TODO: for some reason icon as string does not work
export function SidebarTabsDropdown({ options, value }: SidebarTabsDropdownProps) {
    const selected = options.find(opt => opt.value === value) || options[0];
    const [open, setOpen] = useState(false)

    return <xyd-sidebar-tabs-dropdown className={cn.DropdownHost}>
        <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger asChild onClick={() => setOpen(true)}>
                <button part="dropdown-trigger" type="button">
                    <IconWrapper icon={selected?.icon} />

                    <span part="dropdown-label-group">
                        {selected?.label && <span part="dropdown-label">{selected?.label}</span>}
                        {selected?.description && <span part="dropdown-description">{selected?.description}</span>}
                    </span>

                    <span part="dropdown-chevron">
                        <Chevron />
                    </span>
                </button>
            </Popover.Trigger>

            <Popover.Content part="dropdown-list" align="start" sideOffset={2}>
                {options.map(opt => (
                    <Link
                        key={opt.value}
                        part={"dropdown-listitem"}
                        aria-selected={opt.value === value}
                        to={opt.href || opt.value}
                        onClick={() => setOpen(false)}
                    >
                        <IconWrapper icon={opt.icon} />

                        <span part="dropdown-label-group">
                            <span part="dropdown-label">{opt.label}</span>
                            {opt.description && <span part="dropdown-description">{opt.description}</span>}
                        </span>

                        <span part="chevron-check">
                            {opt.value === value && <CheckvronCheck />}
                        </span>
                    </Link>
                ))}
            </Popover.Content>
        </Popover.Root>
    </xyd-sidebar-tabs-dropdown>
}

function IconWrapper({ icon }: { icon: React.ReactNode | string }) {
    if (!icon) {
        return null
    }

    if (typeof icon === "string") {
        return <span part="dropdown-icon">
            <Icon name={icon} size={18} />
        </span>
    }

    return <span part="dropdown-icon">
        {icon}
    </span>
}

function Chevron() {
    return <svg
        width={8}
        height={24}
        viewBox="0 -9 3 24"
    >
        <path
            d="M0 0L3 3L0 6"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
        />
    </svg>
}

function CheckvronCheck() {
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
    >
        <path d="M20 6 9 17l-5-5" />
    </svg>
}
