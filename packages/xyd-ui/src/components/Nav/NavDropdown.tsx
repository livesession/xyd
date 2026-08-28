import React, { useRef, useState } from "react";
import { DropdownMenu } from "radix-ui";

import { Icon } from "@xyd-js/components/writer";

import * as cn from "./NavDropdown.styles";

/**
 * One entry inside a nav dropdown. Recursive: an entry that carries its own
 * `items` renders a submenu (multi-level). Leaf entries render as links via the
 * router-agnostic `as` component supplied by {@link NavDropdownProps}.
 */
export interface NavDropdownItem {
    title?: string;
    description?: string;
    /** Resolved link target (the framework resolves `page`/`href` via `pageLink`). */
    href?: string | null;
    value?: string;
    icon?: React.ReactNode | string;
    active?: boolean;
    /** Nested entries → a submenu. */
    items?: NavDropdownItem[];
}

export interface NavDropdownProps {
    /** Trigger label. */
    title?: string;
    icon?: React.ReactNode | string;
    /** How the menu opens. Defaults to `"hover"`. */
    trigger?: "hover" | "click";
    /** Menu entries (recursive). */
    items: NavDropdownItem[];
    /**
     * Router-agnostic link component used for leaf entries — receives `{ href }`.
     * The framework passes `FwLink`; falls back to a plain anchor.
     */
    as?: React.ElementType;
    /** Whether the trigger's section is active (a descendant matches the route). */
    active?: boolean;
    className?: string;
}

/** Open after a short hover so a quick sweep across the nav doesn't flash it open. */
const OPEN_DELAY = 140;
/** Small close grace so a brief slip off the edge doesn't snap it shut. */
const CLOSE_DELAY = 120;

function $Link({ children, ...props }: any) {
    return <a {...props}>{children}</a>;
}

function IconSlot({ icon }: { icon?: React.ReactNode | string }) {
    if (!icon) return null;
    if (typeof icon === "string") {
        return (
            <span part="dropdown-icon">
                <Icon name={icon} size={16} />
            </span>
        );
    }
    return <span part="dropdown-icon">{icon}</span>;
}

function Chevron() {
    return (
        <svg part="dropdown-chevron" width={10} height={10} viewBox="0 0 10 10" aria-hidden="true">
            <path
                d="M2 3.5L5 6.5L8 3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function ChevronRight() {
    return (
        <svg part="dropdown-chevron" width={10} height={10} viewBox="0 0 10 10" aria-hidden="true">
            <path
                d="M3.5 2L6.5 5L3.5 8"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function Check() {
    return (
        <svg part="dropdown-check" width={14} height={14} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
        </svg>
    );
}

function ItemBody({ item }: { item: NavDropdownItem }) {
    return (
        <>
            <IconSlot icon={item.icon} />
            <span part="dropdown-label-group">
                {item.title && <span part="dropdown-label">{item.title}</span>}
                {item.description && (
                    <span part="dropdown-description">{item.description}</span>
                )}
            </span>
            {/* Switcher check — only the logoTrailing renderer marks items active; the
                header/tab dropdowns never set `active`, so no check appears there. */}
            {item.active && <Check />}
        </>
    );
}

/**
 * Render menu entries recursively — submenus for entries that carry `items`.
 * Content is rendered INLINE (no `DropdownMenu.Portal`) so the whole menu tree is
 * a DOM descendant of the dropdown host; that is what makes the hover zone one
 * contiguous element (see {@link NavDropdown}).
 */
function renderItems(items: NavDropdownItem[], as?: React.ElementType) {
    const Link = as || $Link;
    return items.map((item, i) => {
        const key = `${item.value || item.href || item.title || "."}-${i}`;

        if (item.items && item.items.length) {
            return (
                <DropdownMenu.Sub key={key}>
                    {/* `asChild` → the styleable custom element IS the submenu trigger. */}
                    <DropdownMenu.SubTrigger asChild>
                        <xyd-nav-dropdown-item
                            part="dropdown-item"
                            data-has-submenu=""
                            data-active={item.active || undefined}
                        >
                            <ItemBody item={item} />
                            <span part="dropdown-submenu-indicator">
                                <ChevronRight />
                            </span>
                        </xyd-nav-dropdown-item>
                    </DropdownMenu.SubTrigger>
                    <DropdownMenu.SubContent asChild sideOffset={0} alignOffset={-4}>
                        <xyd-nav-dropdown-menu className={cn.DropdownList} part="dropdown-list">
                            {renderItems(item.items, as)}
                        </xyd-nav-dropdown-menu>
                    </DropdownMenu.SubContent>
                </DropdownMenu.Sub>
            );
        }

        // Leaf: the router link wraps the styleable item element (mirrors
        // `Nav.ItemRaw` — link = navigation, custom element = the styled box).
        return (
            <DropdownMenu.Item key={key} asChild>
                <Link href={item.href || item.value}>
                    <xyd-nav-dropdown-item
                        part="dropdown-item"
                        data-active={item.active || undefined}
                    >
                        <ItemBody item={item} />
                    </xyd-nav-dropdown-item>
                </Link>
            </DropdownMenu.Item>
        );
    });
}

/**
 * A nav dropdown (header anchor or tab) with a nested, multi-level menu. Built on
 * Radix `DropdownMenu` for native submenus + keyboard/focus/dismiss a11y.
 *
 * `trigger` selects hover (default) vs click. For hover, the menu is rendered
 * INLINE (not portaled) so it is a DOM descendant of the `<xyd-nav-dropdown>`
 * host: moving the pointer from the trigger into the menu (or a submenu) never
 * leaves the host, so a single `onPointerLeave` on the host reliably decides when
 * to close — no dead-gap flicker across a portal boundary. Opens after a short
 * delay so a quick sweep across the nav doesn't flash it open.
 *
 * Router-agnostic: leaf entries use the `as` link component (the framework passes
 * `FwLink`) so it works under the bun engine's router.
 */
export function NavDropdown(props: NavDropdownProps) {
    const { title, icon, trigger = "hover", items, as, active, className } = props;
    const [open, setOpen] = useState(false);
    const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isHover = trigger !== "click";

    const clearTimers = () => {
        if (openTimer.current) clearTimeout(openTimer.current);
        if (closeTimer.current) clearTimeout(closeTimer.current);
        openTimer.current = null;
        closeTimer.current = null;
    };
    const scheduleOpen = () => {
        clearTimers();
        openTimer.current = setTimeout(() => setOpen(true), OPEN_DELAY);
    };
    const scheduleClose = () => {
        clearTimers();
        closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY);
    };
    const onOpenChange = (next: boolean) => {
        // Radix drives this on click / Escape / outside-pointer / select.
        clearTimers();
        setOpen(next);
    };

    const hoverHandlers = isHover
        ? { onPointerEnter: scheduleOpen, onPointerLeave: scheduleClose }
        : {};

    return (
        <xyd-nav-dropdown
            className={`${cn.DropdownHost} ${className || ""}`}
            data-fw-nav-dropdown=""
            data-trigger={trigger}
            {...hoverHandlers}
        >
            {/* `modal={false}` keeps the page interactive (nav dropdowns are non-modal). */}
            <DropdownMenu.Root open={open} onOpenChange={onOpenChange} modal={false}>
                {/* Radix sets `data-state` (open/closed) on the trigger itself. */}
                <DropdownMenu.Trigger
                    part="dropdown-trigger"
                    data-active={active || undefined}
                >
                    <IconSlot icon={icon} />
                    {title && <span part="dropdown-trigger-label">{title}</span>}
                    <Chevron />
                </DropdownMenu.Trigger>

                {/* INLINE (no Portal): the menu is a DOM child of the host, so the
                    host's onPointerLeave governs the whole tree. `sideOffset={0}`
                    keeps it flush so there is no non-host pixel gap to cross.
                    `asChild` → the panel is the styleable `<xyd-nav-dropdown-menu>`
                    custom element (theme/user CSS targets it directly). */}
                <DropdownMenu.Content asChild align="start" sideOffset={0}>
                    <xyd-nav-dropdown-menu className={cn.DropdownList} part="dropdown-list">
                        {renderItems(items, as)}
                    </xyd-nav-dropdown-menu>
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        </xyd-nav-dropdown>
    );
}
