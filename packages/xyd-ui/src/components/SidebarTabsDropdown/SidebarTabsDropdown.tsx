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
    /**
     * Nested options — the entry renders as an inline-expandable GROUP row
     * (a button, not a link): clicking it expands its children indented
     * inside the same popover. Recursive.
     */
    items?: SidebarTabsDropdownOption[];
}

export interface SidebarTabsDropdownProps {
    options: SidebarTabsDropdownOption[];
    value: string;
}

/** Depth-first flatten (parents before children). */
function flattenOptions(options: SidebarTabsDropdownOption[]): SidebarTabsDropdownOption[] {
    const out: SidebarTabsDropdownOption[] = []
    for (const opt of options) {
        out.push(opt)
        if (opt.items?.length) out.push(...flattenOptions(opt.items))
    }
    return out
}

/** True when `value` matches an option anywhere in this subtree. */
function containsValue(option: SidebarTabsDropdownOption, value: string): boolean {
    if (value && option.value === value) return true
    return !!option.items?.some(child => containsValue(child, value))
}

/** First selectable LEAF (groups have no meaningful value). */
function firstLeaf(options: SidebarTabsDropdownOption[]): SidebarTabsDropdownOption | undefined {
    for (const opt of options) {
        if (opt.items?.length) {
            const leaf = firstLeaf(opt.items)
            if (leaf) return leaf
        } else {
            return opt
        }
    }
    return undefined
}

/** Stable expansion key for a group row. */
function groupKey(option: SidebarTabsDropdownOption, path: string): string {
    return `${path}:${option.value || option.label}`
}

// TODO: for some reason icon as string does not work
export function SidebarTabsDropdown({ options, value }: SidebarTabsDropdownProps) {
    const selected = flattenOptions(options).find(opt => opt.value === value) || firstLeaf(options)
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
                {/* The list is an inner component so the expansion state lives
                    with the (non-portaled, non-forceMounted) content — it
                    unmounts on close, so reopening starts fresh with only the
                    ACTIVE option's group(s) expanded. */}
                <$DropdownList
                    options={options}
                    value={value}
                    onNavigate={() => setOpen(false)}
                />
            </Popover.Content>
        </Popover.Root>
    </xyd-sidebar-tabs-dropdown>
}

function $DropdownList({ options, value, onNavigate }: {
    options: SidebarTabsDropdownOption[]
    value: string
    onNavigate: () => void
}) {
    // Groups whose subtree holds the active value start expanded.
    const [expanded, setExpanded] = useState<Set<string>>(() => {
        const initial = new Set<string>()
        const seed = (opts: SidebarTabsDropdownOption[], path: string) => {
            opts.forEach((opt, index) => {
                if (!opt.items?.length) return
                const key = groupKey(opt, `${path}/${index}`)
                if (containsValue(opt, value)) initial.add(key)
                seed(opt.items, `${path}/${index}`)
            })
        }
        seed(options, "")
        return initial
    })

    function toggle(key: string) {
        setExpanded(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    const renderItems = (opts: SidebarTabsDropdownOption[], path: string) =>
        opts.map((opt, index) => {
            const itemKey = opt.value || opt.label || String(index)

            // GROUP row: inline-expandable, never navigates or closes the popover.
            if (opt.items?.length) {
                const key = groupKey(opt, `${path}/${index}`)
                const isExpanded = expanded.has(key)

                return <React.Fragment key={itemKey}>
                    <button
                        type="button"
                        part="dropdown-listitem"
                        data-group="true"
                        aria-expanded={isExpanded}
                        onClick={() => toggle(key)}
                    >
                        <IconWrapper icon={opt.icon} />

                        <span part="dropdown-label-group">
                            <span part="dropdown-label">{opt.label}</span>
                            {opt.description && <span part="dropdown-description">{opt.description}</span>}
                        </span>

                        <span part="dropdown-chevron">
                            <Chevron />
                        </span>
                    </button>

                    {isExpanded && <div part="dropdown-sublist" role="group">
                        {renderItems(opt.items, `${path}/${index}`)}
                    </div>}
                </React.Fragment>
            }

            return <Link
                key={itemKey}
                part={"dropdown-listitem"}
                aria-selected={opt.value === value}
                to={opt.href || opt.value}
                onClick={onNavigate}
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
        })

    return <>{renderItems(options, "")}</>
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
