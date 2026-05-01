import { Outlet } from "react-router";

// Inherit theme CSS — gives plugin pages access to all xyd design tokens
// (--xyd-border-radius-*, --xyd-font-size-*, --color-primary, etc.)
// @ts-ignore
import "virtual:xyd-theme/index.css";
// @ts-ignore
import "virtual:xyd-theme-override/index.css";

/**
 * Layout for plugin custom pages (layout: "custom").
 * Inherits theme CSS by default so design tokens resolve.
 * No sidebar, no header — just the page rendered as a top-layer child of body.
 */
export default function PluginPageLayout() {
    return <Outlet />;
}