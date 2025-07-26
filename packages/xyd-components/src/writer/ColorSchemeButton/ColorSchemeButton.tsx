import React, { useEffect, useState } from "react";

import { Button } from "../Button";

export function ColorSchemeButton() {
    const [currentScheme, changeColorScheme] = useColorScheme() as [string, () => void]

    return <Button
        size="sm"
        theme="ghost"
        icon={currentScheme === "dark" ? <IconDarkMode /> : <IconLightMode />}
        onClick={changeColorScheme}
    />
}

export function useColorScheme(): ["dark" | "light" | null, () => void] {
    const [currentScheme, setCurrentScheme] = useState<"dark" | "light" | null>(null)

    // TODO: context 
    useEffect(() => {
        const updateScheme = () => {
            const html = document.querySelector("html");
            if (html) {
                const scheme = html.getAttribute("data-color-scheme") || "os";
                if (scheme === "os") {
                    const preferred = getPreferredColorScheme();
                    const finalScheme = preferred || "light";
                    setCurrentScheme(finalScheme);
                    updateColorSchemeInHead(finalScheme);
                } else {
                    const finalScheme = scheme as "dark" | "light";
                    setCurrentScheme(finalScheme);
                    updateColorSchemeInHead(finalScheme);
                }
            }
        };

        updateScheme();

        // Listen for changes to the color scheme
        const observer = new MutationObserver(updateScheme);
        const html = document.querySelector("html");
        if (html) {
            observer.observe(html, { attributes: true, attributeFilter: ['data-color-scheme'] });
        }

        return () => observer.disconnect();
    }, []);

    function changeColorScheme() {
        let colorScheme = ""

        const preferredColorScheme = getPreferredColorScheme()
        if (preferredColorScheme) {
            colorScheme = preferredColorScheme === "dark" ? "light" : "dark"
        }

        const html = document.querySelector("html");
        if (!html) return;

        const currentScheme = html.getAttribute("data-color-scheme");
        if (currentScheme && currentScheme !== "os") {
            colorScheme = currentScheme === "dark" ? "light" : "dark";
        }
        if (!colorScheme) {
            colorScheme = "light"
        }

        html.setAttribute("data-color-scheme", colorScheme);
        localStorage.setItem("xyd-color-scheme", colorScheme);
        updateColorSchemeInHead(colorScheme as "dark" | "light");
    }

    return [currentScheme, changeColorScheme]
}


// Function to update color-scheme in document head
function updateColorSchemeInHead(scheme: "dark" | "light") {
    let styleElement = document.querySelector('style[data-color-scheme-style]');

    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.setAttribute('data-color-scheme-style', 'true');
        document.head.appendChild(styleElement);
    }

    styleElement.textContent = `:root { color-scheme: ${scheme}; }`;
}

function getPreferredColorScheme() {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }

    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
    }

    return null
}


function IconLightMode() {
    return <svg
        width={16}
        height={16}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        xmlns="http://www.w3.org/2000/svg"
    >
        <g clipPath="url(#clip0_2880_7340)">
            <path
                d="M8 1.11133V2.00022"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M12.8711 3.12891L12.2427 3.75735"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M14.8889 8H14"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M12.8711 12.8711L12.2427 12.2427"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M8 14.8889V14"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M3.12891 12.8711L3.75735 12.2427"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M1.11133 8H2.00022"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M3.12891 3.12891L3.75735 3.75735"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M8.00043 11.7782C10.0868 11.7782 11.7782 10.0868 11.7782 8.00043C11.7782 5.91402 10.0868 4.22266 8.00043 4.22266C5.91402 4.22266 4.22266 5.91402 4.22266 8.00043C4.22266 10.0868 5.91402 11.7782 8.00043 11.7782Z"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </g>
        <defs>
            <clipPath id="clip0_2880_7340">
                <rect width={16} height={16} fill="white" />
            </clipPath>
        </defs>
    </svg>
}

function IconDarkMode() {
    return <svg
        xmlns="http://www.w3.org/2000/svg"
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
}
