import React from "react"
import { addons, types, useGlobals } from "@storybook/manager-api"

const ADDON_ID = "xyd/sidebar-theme"

const THEMES = [
    { value: "solar", label: "Solar" },
    { value: "poetry", label: "Poetry" },
    { value: "cosmo", label: "Cosmo" },
    { value: "opener", label: "Opener" },
    { value: "picasso", label: "Picasso" },
    { value: "gusto", label: "Gusto" },
]

function ChevronIcon() {
    return (
        <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ flexShrink: 0, opacity: 0.55 }}
        >
            <path
                d="M2.5 3.75L5 6.25L7.5 3.75"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function ThemePicker() {
    const [globals, updateGlobals] = useGlobals()
    const value = (globals.theme as string) || "solar"
    const active = THEMES.find((t) => t.value === value) ?? THEMES[0]

    const wrapStyle: React.CSSProperties = {
        position: "relative",
        display: "block",
        boxSizing: "border-box",
        width: "100%",
        padding: "10px 12px 6px",
    }

    const selectStyle: React.CSSProperties = {
        appearance: "none",
        WebkitAppearance: "none",
        MozAppearance: "none",
        boxSizing: "border-box",
        display: "block",
        width: "100%",
        padding: "7px 24px 7px 10px",
        fontSize: 12,
        fontFamily: "inherit",
        fontWeight: 500,
        lineHeight: 1.2,
        borderRadius: 6,
        border: "1px solid rgba(38, 85, 115, 0.15)",
        background: "rgba(38, 85, 115, 0.04)",
        color: "#2e3438",
        cursor: "pointer",
        outline: "none",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        transition: "background 120ms ease, border-color 120ms ease",
    }

    const labelStyle: React.CSSProperties = {
        position: "absolute",
        left: 22,
        top: 2,
        padding: "0 4px",
        background: "var(--color-app-bg, #ffffff)",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        color: "#798186",
        pointerEvents: "none",
    }

    const chevronStyle: React.CSSProperties = {
        position: "absolute",
        right: 22,
        bottom: 16,
        pointerEvents: "none",
        color: "#2e3438",
    }

    return (
        <div style={wrapStyle}>
            <span style={labelStyle}>Theme</span>
            <select
                value={active.value}
                onChange={(e) => updateGlobals({ theme: e.target.value })}
                style={selectStyle}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(38, 85, 115, 0.08)"
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(38, 85, 115, 0.04)"
                }}
                aria-label="xyd theme"
            >
                {THEMES.map((t) => (
                    <option key={t.value} value={t.value}>
                        {t.label}
                    </option>
                ))}
            </select>
            <span style={chevronStyle}>
                <ChevronIcon />
            </span>
        </div>
    )
}

addons.register(ADDON_ID, () => {
    addons.add(`${ADDON_ID}/sidebar`, {
        type: types.experimental_SIDEBAR_TOP,
        render: () => <ThemePicker />,
    })
})
