import {defineEvents} from 'openux-js'

interface NodeCodeSample {
    tab?: string
    example?: string
    code?: string
}

interface NodeFramework {
    location: string
    uniformRegion?: string
}

interface AnalyticsNodes {
    CodeSample: NodeCodeSample
    Framework: NodeFramework
}

// TODO: in the future + maybe better API
// TODO: how to share nodes between packages
// TODO: node abstraction?
// TODO: merge abstraction?
export const useUXEvents = defineEvents(({CodeSample, Framework}: AnalyticsNodes) => ({
    docs: {
        code: {
            example_change({example}: { example: string }) {
                return {
                    ...commonFrameworkProps({Framework}),
                    example: example,
                }
            },
            tab_change({tab}: { tab: string }) {
                return {
                    ...commonCodeSampleProps({CodeSample, Framework}),
                    tab: tab,
                }
            },
            copy({code}: { code: string }) {
                return {
                    ...commonCodeSampleProps({CodeSample, Framework}),
                    code: (code || "").slice(0, 100) + "...",
                }
            },
            scroll_100() {
                return {
                    ...commonCodeSampleProps({CodeSample, Framework}),
                }
            },
            scroll_depth({depth}: { depth: number }) {
                return {
                    ...commonCodeSampleProps({CodeSample, Framework}),
                    depth,
                }
            },
        },

        details: {
            open({label}: { label: string }) {
                return {
                    ...commonFrameworkProps({Framework}),
                    label: label,
                }
            },
            close({label}: { label: string }) {
                return {
                    ...commonFrameworkProps({Framework}),
                    label: label,
                }
            }
        }
    }
}))

function commonCodeSampleProps({
                                   CodeSample,
                                   Framework
                               }: {
    CodeSample: NodeCodeSample | undefined
    Framework: NodeFramework | undefined
}) {
    return {
        ...commonFrameworkProps({Framework}),
        tab: CodeSample?.tab!,
        example: CodeSample?.example!,
    }
}

function commonFrameworkProps({
                                  Framework
                              }: {
    Framework: NodeFramework | undefined
}) {
    return {
        location: Framework?.location!,
    }
}
