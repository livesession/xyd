import React from "react";
import { Outlet } from "react-router";

/**
 * Minimal layout for plugin pages (login, callback, etc.).
 * No sidebar, no docs navigation — just the page content
 * with basic theme styling applied.
 */
export default function PluginPageLayout() {
    return (
        <div style={{
            minHeight: "100vh",
            background: "var(--xyd-page-body-bgcolor, #fff)",
            color: "var(--xyd-page-body-color, #111)",
            fontFamily: "var(--font-body-family, system-ui, sans-serif)",
        }}>
            <Outlet />
        </div>
    );
}
