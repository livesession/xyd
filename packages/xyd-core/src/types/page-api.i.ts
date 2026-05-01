import type React from "react"
import type { MetaTags } from "./seo"

/**
 * Interface for custom pages (plugin pages, custom login, etc.).
 * Pages that export these named exports get automatic framework integration:
 *
 * - `seoTags()` — injects meta tags into the page head
 * - `shadowCss` — when true, inherits xyd theme CSS variables
 *
 * @example
 * ```tsx
 * // custom-login.tsx
 * import { useAccessControl } from "@xyd-js/client-api"
 *
 * export default function MyLogin() {
 *   const { signInWithOAuth, title } = useAccessControl()
 *   return <button onClick={signInWithOAuth}>{title}</button>
 * }
 *
 * export function seoTags() {
 *   return { description: "Login Page", "og:title": "Sign In" }
 * }
 *
 * export const shadowCss = true // inherit theme tokens (default)
 * ```
 */
export interface PageApi<P = any> {
    /** The page component */
    default: React.ComponentType<P>;

    /** SEO meta tags for this page. Called at render/prerender time. */
    seoTags?: () => Partial<MetaTags> | Promise<Partial<MetaTags>>;

    /**
     * Whether to inherit the xyd theme CSS (design tokens, fonts, etc.).
     * When false, uses pluginPageLayoutBare (no theme CSS).
     * @default true
     */
    shadowCss?: boolean;
}
