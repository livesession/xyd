import {defineEvents} from 'openux-js'

export const EVENT_COMPONENT_TAB_CHANGE = "components.tabs.change"

export class NodeCodeSample {
    tab!: string
    example!: string
    code!: string
}

export class NodeFramework {
    location!: string
    uniformRegion!: string
}

export const AnalyticsNodes = {
    CodeSample: NodeCodeSample,
    Framework: NodeFramework,
} as const

export interface EventsSchema {
    CodeExampleChange: { example: string }
    CodeTabChange: { tab: string }
    CodeCopy: { code: string }
}

// TODO: in the future + maybe better API
// TODO: how to share nodes between packages
// TODO: node abstraction?
// TODO: merge abstraction?
export const useUXEvents = defineEvents<EventsSchema, typeof AnalyticsNodes>({
    CodeExampleChange(args, {Framework}) {
        return {
            ...commonFrameworkProps({Framework}),
            example: args?.example,
        }
    },
    CodeTabChange(args, {CodeSample, Framework}) {
        return {
            ...commonCodeSampleProps({CodeSample, Framework}),
            tab: args?.tab,
        }
    },
    CodeCopy(args, {CodeSample, Framework}) {
        return {
            ...commonCodeSampleProps({CodeSample, Framework}),
            code: (args?.code || "").slice(0, 100),
        }
    }
})

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
        uniformRegion: Framework?.uniformRegion!,
    }
}
