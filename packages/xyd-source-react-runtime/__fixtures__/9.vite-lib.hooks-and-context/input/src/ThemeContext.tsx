import { createContext, useState, useContext } from "react";

interface ThemeContextValue {
    mode: "light" | "dark";
    primaryColor: string;
    fontSize: number;
    setMode: (mode: "light" | "dark") => void;
    setPrimaryColor: (color: string) => void;
    setFontSize: (size: number) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
ThemeContext.displayName = "ThemeContext";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = useState<"light" | "dark">("light");
    const [primaryColor, setPrimaryColor] = useState("#1976d2");
    const [fontSize, setFontSize] = useState(14);

    const value: ThemeContextValue = {
        mode, primaryColor, fontSize,
        setMode, setPrimaryColor, setFontSize,
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
    return ctx;
}