import React from "react";

import * as cn from "./LocaleSwitcher.styles";

export interface LocaleSwitcherLocale {
    code: string;
    name?: string;
}

export interface LocaleSwitcherProps {
    locales: LocaleSwitcherLocale[];
    value: string;
    onChange?: (next: string) => void;
    className?: string;
    "aria-label"?: string;
}

export function LocaleSwitcher(props: LocaleSwitcherProps) {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        props.onChange?.(e.target.value);
    };

    return (
        <span className={`${cn.LocaleSwitcherHost} ${props.className || ""}`}>
            <LanguageIcon />
            <select
                value={props.value}
                onChange={handleChange}
                data-fw-locale-switcher
                aria-label={props["aria-label"] || "Select language"}
            >
                {props.locales.map((l) => (
                    <option key={l.code} value={l.code}>
                        {l.name || l.code}
                    </option>
                ))}
            </select>
            <CaretIcon />
        </span>
    );
}

function LanguageIcon() {
    return (
        <svg
            part="label-icon"
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="currentColor"
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8.516 3a.94.94 0 0 0-.941.94v1.15H2.94a.94.94 0 1 0 0 1.882h7.362a7.422 7.422 0 0 1-1.787 3.958 7.42 7.42 0 0 1-1.422-2.425.94.94 0 1 0-1.774.627 9.303 9.303 0 0 0 1.785 3.043 7.422 7.422 0 0 1-4.164 1.278.94.94 0 1 0 0 1.881 9.303 9.303 0 0 0 5.575-1.855 9.303 9.303 0 0 0 4.11 1.74l-.763 1.525a.968.968 0 0 0-.016.034l-1.385 2.77a.94.94 0 1 0 1.683.841l1.133-2.267h5.806l1.134 2.267a.94.94 0 0 0 1.683-.841l-1.385-2.769a.95.95 0 0 0-.018-.036l-3.476-6.951a.94.94 0 0 0-1.682 0l-1.82 3.639a7.423 7.423 0 0 1-3.593-1.256 9.303 9.303 0 0 0 2.27-5.203h1.894a.94.94 0 0 0 0-1.881H9.456V3.94A.94.94 0 0 0 8.516 3Zm6.426 11.794a1.068 1.068 0 0 1-.02.039l-.703 1.407h3.924l-1.962-3.924-1.24 2.478Z"
            />
        </svg>
    );
}

function CaretIcon() {
    return (
        <svg
            part="caret"
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="currentColor"
        >
            <path d="M17 9.17a1 1 0 0 0-1.41 0L12 12.71 8.46 9.17a1 1 0 1 0-1.41 1.42l4.24 4.24a1.002 1.002 0 0 0 1.42 0L17 10.59a1.002 1.002 0 0 0 0-1.42Z" />
        </svg>
    );
}
