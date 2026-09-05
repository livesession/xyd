import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router"
import { Popover } from "radix-ui";

import * as cn from "./ContextDropdown.styles";

export interface ContextDropdownItem {
    /** Stable identity (used for `aria-selected` matching). */
    value: string;
    label: string;
    description?: string;
    /** Pre-resolved icon ELEMENT (resolve string names in the caller's
     * React tree — see IconWrapper note). */
    icon?: React.ReactNode;
    /** Navigation target — internal (SPA Link) unless `external`. */
    href?: string;
    /** Open `href` in a new tab via a plain anchor. */
    external?: boolean;
    /** Action rows (no href): run and close. */
    onSelect?: () => void;
}

export interface ContextDropdownProps {
    /** Trigger label — e.g. the primary action or the current version. */
    label: string;
    icon?: React.ReactNode;
    /** The currently active item's `value` (check-marked row). */
    value?: string;
    items: ContextDropdownItem[];
}

/**
 * A compact contextual-actions dropdown (page context controls): a pill
 * trigger (icon + label + up/down chevron) opening a menu of rows with
 * icon + title + description — copy page, open in ChatGPT, switch the
 * page's content version, etc.
 */
export function ContextDropdown({ label, icon, value, items }: ContextDropdownProps) {
    const [open, setOpen] = useState(false)
    const hostRef = useRef<HTMLElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)

    // Own dismissal (outside pointerdown + Escape): the app tree renders
    // through wrappers that keep Radix's DismissableLayer from engaging
    // reliably, so close deterministically ourselves.
    useEffect(() => {
        if (!open) return
        const onPointerDown = (e: PointerEvent) => {
            const t = e.target as Node | null
            if (t && (hostRef.current?.contains(t) || contentRef.current?.contains(t))) return
            setOpen(false)
        }
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false)
        }
        document.addEventListener("pointerdown", onPointerDown, true)
        document.addEventListener("keydown", onKeyDown, true)
        return () => {
            document.removeEventListener("pointerdown", onPointerDown, true)
            document.removeEventListener("keydown", onKeyDown, true)
        }
    }, [open])

    return <xyd-context-dropdown ref={hostRef} className={cn.ContextDropdownHost}>
        <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger asChild>
                <button part="context-dropdown-trigger" type="button">
                    <IconWrapper icon={icon} />
                    <span part="context-dropdown-trigger-label">{label}</span>
                    <span part="context-dropdown-chevron">
                        <UpDownChevron />
                    </span>
                </button>
            </Popover.Trigger>

            <Popover.Portal>
            <Popover.Content ref={contentRef} part="context-dropdown-content" align="end" sideOffset={6}>
                {items.map((item) => {
                    const row = <>
                        <IconWrapper icon={item.icon} boxed />
                        <span part="context-dropdown-label-group">
                            <span part="context-dropdown-label">{item.label}</span>
                            {item.description && <span part="context-dropdown-description">{item.description}</span>}
                        </span>
                    </>
                    const selected = !!value && item.value === value

                    if (item.href && item.external) {
                        return <a
                            key={item.value}
                            part="context-dropdown-item"
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setOpen(false)}
                        >{row}</a>
                    }
                    if (item.href) {
                        return <Link
                            key={item.value}
                            part="context-dropdown-item"
                            aria-selected={selected}
                            to={item.href}
                            onClick={() => setOpen(false)}
                        >{row}</Link>
                    }
                    return <button
                        key={item.value}
                        part="context-dropdown-item"
                        type="button"
                        aria-selected={selected}
                        onClick={() => {
                            item.onSelect?.()
                            setOpen(false)
                        }}
                    >{row}</button>
                })}
            </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    </xyd-context-dropdown>
}

// Icons arrive as ELEMENTS — resolved by the caller (the framework layer):
// xyd-ui's bundled Icon context is a different instance than the app's
// IconProvider, so string names would never resolve here.
function IconWrapper({ icon, boxed }: { icon?: React.ReactNode, boxed?: boolean }) {
    if (!icon) return null
    return <span part={boxed ? "context-dropdown-item-icon" : "context-dropdown-trigger-icon"}>
        {icon}
    </span>
}

function UpDownChevron() {
    return <svg width={10} height={14} viewBox="0 0 10 14" fill="none">
        <path d="M2 5L5 2L8 5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 9L5 12L8 9" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
}
