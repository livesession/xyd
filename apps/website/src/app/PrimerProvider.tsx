"use client"

import { ThemeProvider } from "@primer/react-brand";

export default function PrimerProvider({ children }: { children: React.ReactNode }) {
    return <ThemeProvider colorMode="dark">
        {children}
    </ThemeProvider>
}