import React, { createContext, useContext, useMemo, useState } from "react";

/**
 * A tiny opt-in filter layer for the sidebar tree. A theme mounts
 * {@link SidebarFilterProvider} around `<FwSidebar/>` and renders an input bound
 * to `setQuery` (e.g. terrarium's "Filter sidebar"); `FwSidebarItem` consults
 * `query` to hide non-matching items and auto-expand groups that contain a match.
 *
 * Default context = empty query, so themes that never mount the provider render
 * the full sidebar unchanged (no behavior change).
 */
export interface SidebarFilterValue {
    query: string;
    setQuery: (query: string) => void;
}

const SidebarFilterContext = createContext<SidebarFilterValue>({
    query: "",
    setQuery: () => { },
});

export function SidebarFilterProvider({ children }: { children: React.ReactNode }) {
    const [query, setQuery] = useState("");
    const value = useMemo(() => ({ query, setQuery }), [query]);

    return (
        <SidebarFilterContext.Provider value={value}>
            {children}
        </SidebarFilterContext.Provider>
    );
}

export function useSidebarFilter(): SidebarFilterValue {
    return useContext(SidebarFilterContext);
}
