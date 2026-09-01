import type { Sidebar, SidebarAsTocOptions } from "./types/settings";

/**
 * sidebar-as-TOC normalization, shared by every sidebar walk (JS pagemap,
 * route generation, prerender list, search indexing, navlinks, dev preload,
 * the section collector, and the sidebar renderer). The Rust pagemap's gate
 * (crates/xyd_settings/src/pagemap.rs `is_as_toc`) mirrors `asTocEnabled` —
 * keep them in sync: `true` or any object enables, everything else disables.
 */

/** All options resolved to concrete booleans (defaults applied). */
export interface ResolvedAsTocOptions {
    indicator: boolean;
    breadcrumbs: boolean;
}

/** Is this group a sidebar-as-TOC group? (`true` or `{...}` — `false`/absent is not.) */
export function asTocEnabled(value: Sidebar["asToc"]): boolean {
    return value === true || (typeof value === "object" && value !== null);
}

/**
 * Resolve an `asToc` value to its full options (every behavior defaults to
 * enabled), or `null` when the group is not an asToc group.
 */
export function asTocOptions(value: Sidebar["asToc"]): ResolvedAsTocOptions | null {
    if (!asTocEnabled(value)) return null;
    const opts: SidebarAsTocOptions = typeof value === "object" && value !== null ? value : {};
    return {
        indicator: opts.indicator !== false,
        breadcrumbs: opts.breadcrumbs !== false,
    };
}
