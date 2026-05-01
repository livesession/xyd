/**
 * Filters search documents by the current user's access level.
 * Browser-safe — no Node.js dependencies.
 */
export function filterSearchDocs<T extends { access?: string }>(docs: T[]): Omit<T, 'access'>[] {
    if (typeof window === "undefined") {
        return docs.filter(d => !d.access || d.access === "public")
            .map(({ access, ...rest }) => rest) as Omit<T, 'access'>[]
    }

    const auth = (window as any).__xydAuthState
    const isAuth = auth?.authenticated || false
    const groups: string[] = auth?.groups || []

    return docs.filter(d => {
        const a = d.access
        if (!a || a === "public") return true
        if (!isAuth) return false
        if (a === "authenticated") return true
        return a.split(",").some(g => groups.includes(g))
    }).map(({ access, ...rest }) => rest) as Omit<T, 'access'>[]
}

/**
 * Generates a virtual module string for search data.
 * Handles access control filtering transparently — search plugins just call this
 * instead of manually JSON.stringify-ing their data.
 *
 * @param sections - Raw sections from mapSettingsToDocSections (may include `access` field)
 * @param mapper - Plugin's mapping function (e.g., mapDocSectionsToOrama)
 * @param extras - Additional exports for the virtual module (e.g., cloudConfig, suggestions)
 *
 * @example
 * ```ts
 * import { createSearchDataModule } from "@xyd-js/content/search"
 * const sections = await mapSettingsToDocSections(settings)
 * return createSearchDataModule(sections, mapDocSectionsToOrama, { cloudConfig, suggestions })
 * ```
 */
export function createSearchDataModule<T>(
    sections: Array<{ access?: string; [key: string]: any }>,
    mapper: (section: any) => T,
    extras: Record<string, any> = {}
): string {
    const mapped = sections.map(mapper)
    const hasAccess = sections.some(s => s.access && s.access !== "public")

    const extrasEntries = Object.entries(extras)
        .map(([key, value]) => `    ${key}: ${JSON.stringify(value)}`)
        .join(",\n")

    if (hasAccess) {
        // Build a parallel access array keyed to the mapped sections.
        // The virtual module imports filterSearchDocs and applies it at load time.
        const accessList = sections.map(s => s.access || "public")

        return [
            `import { filterSearchDocs as __filter } from "@xyd-js/content/search";`,
            `const __docs = ${JSON.stringify(mapped)};`,
            `const __access = ${JSON.stringify(accessList)};`,
            `const __tagged = __docs.map(function(d, i) {`,
            `    return Object.assign({}, d, { access: __access[i] });`,
            `});`,
            `export default {`,
            `    docs: __filter(__tagged),`,
            extrasEntries ? `${extrasEntries}` : "",
            `};`,
        ].filter(Boolean).join("\n")
    }

    return [
        `export default {`,
        `    docs: ${JSON.stringify(mapped)},`,
        extrasEntries ? `${extrasEntries}` : "",
        `};`,
    ].filter(Boolean).join("\n")
}