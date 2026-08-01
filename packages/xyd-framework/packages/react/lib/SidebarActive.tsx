import React, { createContext, useContext, useMemo } from "react";

interface ISidebarActiveContext {
    /**
     * The sidebar href considered "active" — overrides route-based active for the
     * sidebar highlight + auto-expansion. Used by scroll-spy hosts (the API
     * editor renders the whole spec and syncs the active item to the scrolled-to
     * reference). When undefined, the sidebar uses its normal route-based active.
     */
    activeHref?: string;
}

const SidebarActiveContext = createContext<ISidebarActiveContext>({});

export function SidebarActiveProvider({
    activeHref,
    children,
}: {
    activeHref?: string;
    children: React.ReactNode;
}) {
    const value = useMemo(() => ({ activeHref }), [activeHref]);
    return <SidebarActiveContext value={value}>{children}</SidebarActiveContext>;
}

export function useSidebarActive() {
    return useContext(SidebarActiveContext);
}
