import { html } from "lit";

export function IconClose() {
    return html`
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
        >
            <path d="M18 6L6 18"></path>
            <path d="M6 6l12 12"></path>
        </svg>
    `
}
