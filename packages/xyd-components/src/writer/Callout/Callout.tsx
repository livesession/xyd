import React from "react"

import * as cn from "./Callout.styles";

/**
 * Props for the Callout component
 */
export interface CalloutProps {
    /** Additional CSS class name to be applied to the callout */
    className?: string;

    /** Content to be displayed inside the callout */
    children: React.ReactNode;

    kind?: "warning" | "note" | "tip" | "check" | "danger"
}

/**
 * A Callout component that displays important information or notices in a visually distinct way.
 * It includes an info icon and a message area for content.
 * 
 * @category Component
 */
export function Callout({ className, children, kind }: CalloutProps) {
    let icon

    switch (kind) {
        case "tip":
            icon = <$BulbIcon />
            break
        case "check":
            icon = <$CheckIcon />
            break
        case "warning":
            icon = <$WarningIcon />
            break
        case "danger":
            icon = <$DangerIcon />
            break
        case "note":
            icon = <$NoteIcon />
            break
        default:
            icon = <$IconInfo />
            break
    }

    return <xyd-callout
        data-kind={kind}
        className={`${cn.CalloutHost} ${className || ''}`}
    >
        <div part="icon">
            {icon}
        </div>
        <div part="message">
            <div part="message-body">
                {children}
            </div>
        </div>
    </xyd-callout>
}

function $IconInfo() {
    return <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="currentColor"
        viewBox="0 0 24 24"
    >
        <path d="M13 12a1 1 0 1 0-2 0v4a1 1 0 1 0 2 0v-4Zm-1-2.5A1.25 1.25 0 1 0 12 7a1.25 1.25 0 0 0 0 2.5Z" />
        <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2ZM4 12a8 8 0 1 1 16 0 8 8 0 0 1-16 0Z"
            clipRule="evenodd"
        />
    </svg>
}

function $BulbIcon() {
    return <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
    >
        <g
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
        >
            <path d="M17.252 12.49c-.284 2.365-1.833 3.31-2.502 3.996c-.67.688-.55.825-.505 1.834a.916.916 0 0 1-.916.971h-2.658a.92.92 0 0 1-.917-.971c0-.99.092-1.22-.504-1.834c-.76-.76-2.548-1.833-2.548-4.784a5.307 5.307 0 1 1 10.55.788" />
            <path d="M10.46 19.236v1.512c0 .413.23.752.513.752h2.053c.285 0 .514-.34.514-.752v-1.512m-2.32-10.54a2.227 2.227 0 0 0-2.226 2.227m10.338.981h1.834m-3.68-6.012l1.301-1.301M18.486 17l1.301 1.3M12 2.377V3.86m-6.76.73l1.292 1.302M4.24 18.3L5.532 17m-.864-5.096H2.835" />
        </g>
    </svg>
}

function $CheckIcon() {
    return <svg
        xmlns="http://www.w3.org/2000/svg"
        width={24}
        height={24}
        viewBox="0 0 24 24"
    >
        <path
            fill="currentColor"
            d="m9.55 18l-5.7-5.7l1.425-1.425L9.55 15.15l9.175-9.175L20.15 7.4z"
        />
    </svg>
}

function $WarningIcon() {
    return <svg
        xmlns="http://www.w3.org/2000/svg"
        width={24}
        height={24}
        viewBox="-2 -3 24 24"
    >
        <path
            fill="currentColor"
            d="m12.8 1.613l6.701 11.161c.963 1.603.49 3.712-1.057 4.71a3.2 3.2 0 0 1-1.743.516H3.298C1.477 18 0 16.47 0 14.581c0-.639.173-1.264.498-1.807L7.2 1.613C8.162.01 10.196-.481 11.743.517c.428.276.79.651 1.057 1.096m-2.22.839a1.077 1.077 0 0 0-1.514.365L2.365 13.98a1.17 1.17 0 0 0-.166.602c0 .63.492 1.14 1.1 1.14H16.7c.206 0 .407-.06.581-.172a1.164 1.164 0 0 0 .353-1.57L10.933 2.817a1.1 1.1 0 0 0-.352-.365zM10 14a1 1 0 1 1 0-2a1 1 0 0 1 0 2m0-9a1 1 0 0 1 1 1v4a1 1 0 0 1-2 0V6a1 1 0 0 1 1-1"
        />
    </svg>
}

function $DangerIcon() {
    return <svg
        xmlns="http://www.w3.org/2000/svg"
        width={24}
        height={24}
        viewBox="0 0 24 24"
    >
        <path
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20.5 15.8V8.2a1.91 1.91 0 0 0-.944-1.645l-6.612-3.8a1.88 1.88 0 0 0-1.888 0l-6.612 3.8A1.9 1.9 0 0 0 3.5 8.2v7.602a1.91 1.91 0 0 0 .944 1.644l6.612 3.8a1.88 1.88 0 0 0 1.888 0l6.612-3.8A1.9 1.9 0 0 0 20.5 15.8M12 7.627v5.5m0 3.246v-.5"
        />
    </svg>
}

function $NoteIcon() {
    return <svg
        xmlns="http://www.w3.org/2000/svg"
        width={24}
        height={24}
        viewBox="0 0 24 24"
    >
        <g className="pin-outline">
            <g
                fill="currentColor"
                fillRule="evenodd"
                className="Vector"
                clipRule="evenodd"
            >
                <path d="M12 16.143a1 1 0 0 1 1 1V21a1 1 0 0 1-2 0v-3.857a1 1 0 0 1 1-1" />
                <path d="M8.447 4.223q0 .01.007.033c.05.17.12.344.198.51c.262.549.53 1.246.53 2.027v3.85c0 1.03-.442 1.97-1.109 2.666c-.49.512-.873.979-1.169 1.391c-.114.16-.133.269-.135.321a.25.25 0 0 0 .052.16c.089.126.352.319.83.319h4.985a1 1 0 1 1 0 2H7.652c-.987 0-1.93-.403-2.468-1.17c-.58-.827-.556-1.887.095-2.795c.355-.495.8-1.035 1.35-1.61c.358-.373.553-.833.553-1.282v-3.85c0-.335-.118-.71-.336-1.168a5.5 5.5 0 0 1-.31-.805c-.265-.898.081-1.68.664-2.168C7.736 2.204 8.455 2 9.124 2h3.512a1 1 0 1 1 0 2H9.124c-.303 0-.536.099-.64.186a.2.2 0 0 0-.037.037m-.005.007" />
                <path d="M15.553 4.223a3.5 3.5 0 0 1-.206.543c-.26.549-.529 1.246-.529 2.027v3.85c0 1.03.442 1.97 1.109 2.666c.49.512.873.979 1.169 1.391c.114.16.133.269.135.321a.25.25 0 0 1-.052.16c-.089.126-.352.319-.83.319h-4.985a1 1 0 1 0 0 2h4.985c.986 0 1.928-.403 2.467-1.17c.58-.827.556-1.887-.095-2.795c-.355-.495-.8-1.035-1.35-1.61c-.358-.373-.553-.833-.553-1.282v-3.85c0-.335.118-.71.335-1.168c.116-.243.226-.515.311-.805c.265-.898-.081-1.68-.664-2.168C16.264 2.204 15.545 2 14.876 2h-3.512a1 1 0 1 0 0 2h3.512c.303 0 .536.099.64.186q.029.026.037.037m.005.007" />
            </g>
        </g>
    </svg>
}