import { defineEvents } from 'openux-js'

interface NodeFramework {
    location: string
    uniformRegion?: string
}

interface AnalyticsNodes {
    Framework: NodeFramework
}

// TODO: in the future + maybe better API
export const useUXEvents = defineEvents(({ Framework }: AnalyticsNodes) => ({
    docs: {
        copy_page() {
            return {
                ...commonUniformProps({ Framework }),
            }
        },
        search: {
            open() {
                return {
                }
            },
            result_click({ title, description }: { title: string, description: string }) {
                let sanitizeDescription = (description || "").slice(0, 100)
                if (sanitizeDescription.length < description.length) {
                    sanitizeDescription += "..."
                }
                return {
                    title,
                    description: sanitizeDescription,
                }
            },
            query_change({ term }: { term: string }) {
                let sanitizeTerm = term.slice(0, 100)
                if (sanitizeTerm.length < term.length) {
                    sanitizeTerm += "..."
                }
                
                return {
                    term: sanitizeTerm,
                }
            }
        }
    }
}))


function commonUniformProps({
    Framework
}: {
    Framework: NodeFramework | undefined
}) {
    return {
        location: Framework?.location!
    }
}
