import { createContext, useCallback, useEffect, useMemo, useState } from "react";

type ColorScheme = "light" | "dark" | "system";

interface ThemeContextValue {
    colorScheme: ColorScheme;
    resolvedTheme: "light" | "dark";
    accentColor: string;
    setColorScheme: (scheme: ColorScheme) => void;
    setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
ThemeContext.displayName = "ThemeContext";

function resolveSystemTheme(): "light" | "dark" {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
        if (typeof window === "undefined") return "system";
        return (localStorage.getItem("todo-color-scheme") as ColorScheme) || "system";
    });
    const [accentColor, setAccentColor] = useState(() => {
        if (typeof window === "undefined") return "#3b82f6";
        return localStorage.getItem("todo-accent-color") || "#3b82f6";
    });

    const resolvedTheme = useMemo(
        () => (colorScheme === "system" ? resolveSystemTheme() : colorScheme),
        [colorScheme],
    );

    useEffect(() => {
        localStorage.setItem("todo-color-scheme", colorScheme);
        document.documentElement.setAttribute("data-theme", resolvedTheme);
    }, [colorScheme, resolvedTheme]);

    useEffect(() => {
        localStorage.setItem("todo-accent-color", accentColor);
        document.documentElement.style.setProperty("--accent", accentColor);
    }, [accentColor]);

    const handleSetColorScheme = useCallback((scheme: ColorScheme) => {
        setColorScheme(scheme);
    }, []);

    const handleSetAccentColor = useCallback((color: string) => {
        setAccentColor(color);
    }, []);

    const value = useMemo(
        (): ThemeContextValue => ({
            colorScheme,
            resolvedTheme,
            accentColor,
            setColorScheme: handleSetColorScheme,
            setAccentColor: handleSetAccentColor,
        }),
        [colorScheme, resolvedTheme, accentColor, handleSetColorScheme, handleSetAccentColor],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export { ThemeContext, ThemeProvider };
