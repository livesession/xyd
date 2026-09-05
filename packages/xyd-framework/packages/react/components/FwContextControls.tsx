import React, { useState } from "react";
import { useLocation } from "react-router";

import {
    CONTENT_VERSION_DEFAULT_PARAM,
    contentVersionValue,
    contextControlDefaults,
    isContentVersionSwap,
    resolveContextControls,
    type ComponentPageImport,
    type ContextControlAction,
    type ContextControlAppearance,
    type ResolvedContextControl,
} from "@xyd-js/core";
import { Button, Icon } from "@xyd-js/components/writer";
import { ContextDropdown, type ContextDropdownItem } from "@xyd-js/ui";
import { useUXEvents } from "@xyd-js/analytics";

import { useComponents, useMetadata, useRawPage, useSettings } from "../contexts";

/** Current page slug (basename-stripped, no leading slash) — the key space
 * shared by sidebar `page` entries and content-version `page` targets. */
function useCurrentSlug(): string {
    const location = useLocation()
    const settings = useSettings()
    let pathname = location?.pathname || ""
    const basename = settings?.advanced?.basename
    if (basename && basename !== "/" && pathname.startsWith(basename)) {
        pathname = pathname.slice(basename.length)
    }
    return pathname.replace(/^\/+/, "").replace(/\/+$/, "")
}

/** The page context controls resolved for the current page, filtered by slot. */
export function useContextControls(appearance?: ContextControlAppearance): ResolvedContextControl[] {
    const settings = useSettings()
    const metadata = useMetadata()
    const slug = useCurrentSlug()
    const controls = resolveContextControls(settings, metadata, slug)
    return appearance ? controls.filter(c => c.appearance === appearance) : controls
}

/**
 * Page context controls for ONE appearance slot (`header` | `toc-top` |
 * `toc-bottom`) — contextual page actions, dropdown groups, the
 * content-version switcher, and custom components. Renders nothing when the
 * slot is empty, so themes mount it unconditionally.
 */
export function FwContextControls({ appearance }: { appearance: ContextControlAppearance }) {
    const controls = useContextControls(appearance)
    if (!controls.length) return null

    return <div
        part="context-controls"
        data-appearance={appearance}
        style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}
    >
        {controls.map((control, i) => <$Control key={i} control={control} />)}
    </div>
}

function $Control({ control }: { control: ResolvedContextControl }) {
    switch (control.type) {
        case "copy":
        case "view-markdown":
        case "chatgpt":
        case "claude":
        case "mcp":
            return <$ActionButton control={control} />
        case "dropdown":
            return <$Dropdown control={control} />
        case "content-version":
            return <$ContentVersion control={control} />
        case "custom":
            return <$Custom control={control} />
        default:
            return null
    }
}

// ── actions ─────────────────────────────────────────────────────────────────

/** The behavior of one action control: either an href (view-markdown /
 * chatgpt / claude open links) or a click handler (copy / mcp write the
 * clipboard). */
function useAction(control: ContextControlAction) {
    const rawPage = useRawPage()
    const ux = useUXEvents()
    const slug = useCurrentSlug()

    const mdPath = `/${slug}.md`
    const absMdUrl = () =>
        typeof window === "undefined" ? mdPath : `${window.location.origin}${mdPath}`
    const aiPrompt = () => encodeURIComponent(`Read ${absMdUrl()} so I can ask questions about it.`)

    switch (control.type) {
        case "copy":
            return {
                onSelect: () => {
                    navigator.clipboard.writeText(rawPage || "")
                    ux.docs.copy_page({})
                },
                copies: true,
            }
        case "view-markdown":
            return { href: mdPath, external: true }
        case "chatgpt":
            return { href: `https://chatgpt.com/?q=${aiPrompt()}`, external: true }
        case "claude":
            return { href: `https://claude.ai/new?q=${aiPrompt()}`, external: true }
        case "mcp":
            return {
                onSelect: () => navigator.clipboard.writeText(control.options.url),
                copies: true,
            }
    }
}

function $ActionButton({ control }: { control: ContextControlAction & { appearance: string } }) {
    const [done, setDone] = useState(false)
    const action = useAction(control)
    const defaults = contextControlDefaults(control.type)
    const label = control.label ?? defaults.label
    const icon = done ? "check" : (control.icon ?? defaults.icon)

    if (action.href) {
        return <a href={action.href} target="_blank" rel="noopener noreferrer" part="context-control-action">
            <Button icon={<Icon name={icon} size={12} />}>{label}</Button>
        </a>
    }
    return <Button
        icon={<Icon name={icon} size={12} />}
        onClick={() => {
            action.onSelect?.()
            if (action.copies) {
                setDone(true)
                setTimeout(() => setDone(false), 2000)
            }
        }}
    >{label}</Button>
}

/** Resolve an icon NAME to an element HERE (framework) — xyd-ui bundles its
 * own copy of the Icon context, so strings passed down never resolve. */
function iconNode(name?: string): React.ReactNode {
    return name ? <Icon name={name} size={18} /> : undefined
}

function $Dropdown({ control }: { control: Extract<ResolvedContextControl, { type: "dropdown" }> }) {
    // normalizeControl guarantees nested entries are typed actions.
    const actions = control.options.controls as ContextControlAction[]
    const defaults = contextControlDefaults("dropdown")

    return <$DropdownShell
        label={control.label ?? defaults.label}
        icon={control.icon}
        rows={actions}
    />
}

/** Builds the ContextDropdown items from the grouped action controls. */
function $DropdownShell({ label, icon, rows }: {
    label: string
    icon?: string
    rows: ContextControlAction[]
}) {
    const rawPage = useRawPage()
    const ux = useUXEvents()
    const slug = useCurrentSlug()

    const mdPath = `/${slug}.md`
    const absMdUrl = typeof window === "undefined" ? mdPath : `${window.location.origin}${mdPath}`
    const aiPrompt = encodeURIComponent(`Read ${absMdUrl} so I can ask questions about it.`)

    const items: ContextDropdownItem[] = rows.map((action, i) => {
        const defaults = contextControlDefaults(action.type)
        const base = {
            value: `${action.type}-${i}`,
            label: action.label ?? defaults.label,
            description: action.description ?? defaults.description,
            icon: iconNode(action.icon ?? defaults.icon),
        }
        switch (action.type) {
            case "copy":
                return {
                    ...base,
                    onSelect: () => {
                        navigator.clipboard.writeText(rawPage || "")
                        ux.docs.copy_page({})
                    },
                }
            case "view-markdown":
                return { ...base, href: mdPath, external: true }
            case "chatgpt":
                return { ...base, href: `https://chatgpt.com/?q=${aiPrompt}`, external: true }
            case "claude":
                return { ...base, href: `https://claude.ai/new?q=${aiPrompt}`, external: true }
            case "mcp":
                return { ...base, onSelect: () => navigator.clipboard.writeText(action.options.url) }
        }
    })

    return <ContextDropdown label={label} icon={iconNode(icon)} items={items} />
}

// ── content-version ─────────────────────────────────────────────────────────

function $ContentVersion({ control }: { control: Extract<ResolvedContextControl, { type: "content-version" }> }) {
    const slug = useCurrentSlug()
    const location = useLocation()
    const versions = control.options.versions

    if (isContentVersionSwap(control)) {
        // Same-URL swap mode: selection lives in the (configurable) query
        // param; the loaders compile the selected version's `source`, so the
        // pathname never changes and deep links render the variant directly.
        const queryParam = control.options.queryParam ?? CONTENT_VERSION_DEFAULT_PARAM
        const params = new URLSearchParams(location?.search || "")
        const requested = params.get(queryParam)
        const current = versions.find(v => contentVersionValue(v) === requested) ?? versions[0]

        const items: ContextDropdownItem[] = versions.map((v, i) => {
            const value = contentVersionValue(v)
            const next = new URLSearchParams(location?.search || "")
            if (i === 0) next.delete(queryParam) // default keeps the URL clean
            else next.set(queryParam, value)
            const qs = next.toString()
            return {
                value,
                label: v.title,
                description: v.description,
                icon: iconNode(v.icon),
                href: `${location?.pathname || `/${slug}`}${qs ? `?${qs}` : ""}`,
            }
        })

        return <ContextDropdown
            label={control.label ?? current.title}
            icon={iconNode(control.icon ?? current.icon)}
            value={contentVersionValue(current)}
            items={items}
        />
    }

    const current = versions.find(v => (v.page || "").replace(/^\/+/, "") === slug) ?? versions[0]

    const items: ContextDropdownItem[] = versions.map(v => ({
        value: v.page || contentVersionValue(v),
        label: v.title,
        description: v.description,
        icon: iconNode(v.icon),
        href: (v.page || "").startsWith("/") ? v.page! : `/${v.page}`,
    }))

    return <ContextDropdown
        label={control.label ?? current.title}
        icon={iconNode(control.icon ?? current.icon)}
        value={current.page || contentVersionValue(current)}
        items={items}
    />
}

// ── custom ──────────────────────────────────────────────────────────────────

function $Custom({ control }: { control: Extract<ResolvedContextControl, { type: "custom" }> }) {
    const components = useComponents()
    const spec = control.component
    const name = typeof spec === "string" ? spec : (spec as ComponentPageImport).import
    const props = typeof spec === "string" ? {} : ((spec as ComponentPageImport).props || {})

    const Comp = components?.[name] as React.ComponentType<Record<string, unknown>> | undefined
    if (!Comp) {
        console.warn(`[xyd] context-control custom component not found: ${name}`)
        return null
    }
    return <Comp {...props} />
}
