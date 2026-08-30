import React from "react";

import { useSidebarFilter } from "../contexts";

// Inline base styles (the framework build does not run the Linaria transform, so
// no `css` tag here). Themes refine via `[part="sidebar-filter-input"]` /
// `[part="sidebar-filter-icon"]`.
const wrapperStyle: React.CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
};

const iconStyle: React.CSSProperties = {
    position: "absolute",
    left: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--xyd-sidebar-item-color, var(--color-text))",
    pointerEvents: "none",
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    // extra left padding leaves room for the leading filter icon (10px gutter +
    // 16px icon + 6px gap)
    padding: "8px 10px 8px 32px",
    fontSize: "var(--xyd-font-size-small, 14px)",
    color: "var(--color-text)",
    background: "var(--color-bg)",
    border: "1px solid var(--xyd-sidebar-filter-border-color, var(--xyd-sidebar-divider-color))",
    borderRadius: "var(--xyd-border-radius-medium, 8px)",
    outline: "none",
};

/**
 * Built-in sidebar tree filter — an opt-in input (enabled via
 * `components.filterSidebar`) that narrows the sidebar to matching items. Reads
 * the `SidebarFilterContext` that `FwSidebar` provides; `FwSidebarItem` consults
 * the same query to hide non-matching items + auto-expand groups.
 */
export function FwSidebarFilter({ placeholder }: { placeholder?: string }) {
    const { query, setQuery } = useSidebarFilter();
    const label = placeholder || "Filter sidebar";

    return (
        <div part="sidebar-filter">
            <div part="sidebar-filter-field" style={wrapperStyle}>
                <span part="sidebar-filter-icon" style={iconStyle}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 16 16"
                        aria-hidden="true"
                    >
                        <g fill="currentColor">
                            <path d="M1 3.75A.75.75 0 011.75 3h12.5a.75.75 0 010 1.5H1.75A.75.75 0 011 3.75zM3.5 7.75A.75.75 0 014.25 7h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM6.75 11a.75.75 0 000 1.5h2.5a.75.75 0 000-1.5h-2.5z" />
                        </g>
                    </svg>
                </span>
                <input
                    part="sidebar-filter-input"
                    type="text"
                    style={inputStyle}
                    placeholder={label}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label={label}
                />
            </div>
        </div>
    );
}
